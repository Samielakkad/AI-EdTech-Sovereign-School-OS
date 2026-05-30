import { useState, useRef, useCallback } from 'react';

export type RecordingState = 'idle' | 'recording' | 'denied';

export const useRecorder = () => {
    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setRecordingState('recording');
            
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();

        } catch (err) {
            console.error("Microphone access denied:", err);
            setRecordingState('denied');
        }
    }, []);

    const stopRecording = useCallback((): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.onstop = () => {
                    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                    audioChunksRef.current = [];
                    setRecordingState('idle');
                    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
                    resolve(audioBlob);
                };
                mediaRecorderRef.current.stop();
            } else {
                reject(new Error("Not recording or recorder not initialized."));
            }
        });
    }, []);

    return { recordingState, startRecording, stopRecording };
};
