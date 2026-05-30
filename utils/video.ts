// A utility to extract frames from a video file on the client-side.
// This can be resource-intensive and may not work for very large files.
export const extractFramesFromVideo = async (videoFile: File, maxFrames: number = 10): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const frames: string[] = [];

        video.preload = 'metadata';
        video.src = URL.createObjectURL(videoFile);
        video.muted = true;

        video.onloadedmetadata = async () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const duration = video.duration;
            if (duration === 0) {
                resolve([]);
                return;
            }

            const interval = duration / maxFrames;
            let capturedFrames = 0;

            const captureFrame = (time: number) => {
                return new Promise<void>((resolveCapture) => {
                    video.onseeked = () => {
                        if (!context) {
                            reject('Canvas context not available');
                            return;
                        }
                        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                        // Get base64 data without the data:image/jpeg;base64, prefix
                        frames.push(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
                        capturedFrames++;
                        resolveCapture();
                    };
                    video.currentTime = time;
                });
            };

            for (let i = 0; i < maxFrames; i++) {
                const time = i * interval;
                if (time <= duration) {
                    await captureFrame(time);
                }
            }

            URL.revokeObjectURL(video.src);
            resolve(frames);
        };

        video.onerror = (e) => {
            URL.revokeObjectURL(video.src);
            reject(`Error loading video: ${e}`);
        };

        // Start playback to ensure frames can be captured on all browsers
        video.play().catch(e => reject(`Video playback error: ${e}`));
    });
};
