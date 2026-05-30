import React, { useState, useEffect } from 'react';
import Button from '../common/Button.tsx';
import Select from '../common/Select.tsx';
import { MicIcon, CloseIcon } from '../icons/SettingsIcon.tsx';
import { transcribeAudio } from '../../services/geminiService.ts';
import { IncidentType, StudentProfile } from '../../types.ts';
import * as studentDataService from '../../services/studentDataService.ts';
import * as approvalService from '../../services/approvalService.ts';
import { useRecorder } from '../../hooks/useRecorder.ts';

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<typeof initialIncidentData>;
}

type ModalState = 'form' | 'submitted';

const initialIncidentData = { 
    studentId: '', 
    summary: '', 
    severity: 'low' as 'low' | 'medium' | 'high',
    incidentType: 'Disruption' as IncidentType,
};

const IncidentModal: React.FC<IncidentModalProps> = ({ isOpen, onClose, initialData = {} }) => {
  const [modalState, setModalState] = useState<ModalState>('form');
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [incidentData, setIncidentData] = useState({ ...initialIncidentData, ...initialData });
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { recordingState, startRecording, stopRecording } = useRecorder();

  useEffect(() => {
    if (isOpen) {
      const allStudents = studentDataService.getStudentProfiles();
      setStudents(allStudents);
      setModalState('form');
      setIncidentData({
          ...initialIncidentData,
          studentId: allStudents[0]?.id || '', // Ensure student is reset
          ...initialData
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleMicClick = async () => {
    if (recordingState === 'recording') {
        setIsTranscribing(true);
        try {
            const audioBlob = await stopRecording();
            const transcribedText = await transcribeAudio(audioBlob);
            setIncidentData(prev => ({ ...prev, summary: prev.summary ? `${prev.summary}\n${transcribedText}` : transcribedText }));
        } catch (error) {
            console.error("Transcription failed:", error);
        } finally {
            setIsTranscribing(false);
        }
    } else {
        await startRecording();
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedStudent = students.find(s => s.id === incidentData.studentId);
    if (!selectedStudent) return;
    const teacher = studentDataService.getTeachers()[0];
    if (!teacher) return; // Should not happen

    const newIncident = studentDataService.addIncidentToStudent(incidentData.studentId, {
        studentId: incidentData.studentId,
        studentName: selectedStudent.name,
        summary: incidentData.summary,
        severity: incidentData.severity,
        incidentType: incidentData.incidentType,
    });

    if (newIncident && newIncident.severity === 'high') {
        approvalService.addRequest({
            requesterId: teacher.id,
            requesterName: teacher.name,
            studentId: selectedStudent.id,
            studentName: selectedStudent.name,
            type: 'HIGH_SEVERITY_INCIDENT',
            relatedId: newIncident.id,
            details: `High severity incident: ${newIncident.incidentType} - ${newIncident.summary}`
        });
    }

    setModalState('submitted');

    setTimeout(() => {
        onClose();
    }, 2000);
  };

  const getMicButtonContent = () => {
      switch (recordingState) {
          case 'recording':
              return <span className="text-red-400 animate-pulse">Recording... (Click to Stop)</span>;
          case 'denied':
              return 'Microphone Access Denied';
          default:
              if (isTranscribing) return 'Transcribing...';
              return <><MicIcon className="w-5 h-5 mr-2" /> Dictate Details</>;
      }
  }

  const renderContent = () => {
    switch(modalState) {
        case 'form':
            return (
                 <form onSubmit={handleSubmit}>
                    <h2 className="text-xl font-bold mb-6">Log New Incident</h2>
                    <div className="space-y-4">
                        <Select label="Student Name" value={incidentData.studentId} onChange={(e) => setIncidentData({...incidentData, studentId: e.target.value})}>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </Select>
                        <Select label="Incident Type" value={incidentData.incidentType} onChange={(e) => setIncidentData({...incidentData, incidentType: e.target.value as IncidentType})}>
                            <option value="Disruption">Disruption</option>
                            <option value="Off-task">Off-task Behavior</option>
                            <option value="Positive Behavior">Positive Behavior</option>
                            <option value="Conflict">Conflict</option>
                            <option value="Safety Concern">Safety Concern</option>
                        </Select>
                        <Select label="Severity" value={incidentData.severity} onChange={(e) => setIncidentData({...incidentData, severity: e.target.value as typeof incidentData.severity})}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </Select>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Details</label>
                            <textarea
                                className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Describe the incident here, or use the dictate button below..."
                                rows={4}
                                value={incidentData.summary}
                                onChange={(e) => setIncidentData({...incidentData, summary: e.target.value})}
                                required
                            />
                        </div>
                        <Button type="button" variant="secondary" onClick={handleMicClick} disabled={isTranscribing || recordingState === 'denied'} className="w-full flex items-center justify-center">
                            {getMicButtonContent()}
                        </Button>
                        <div className="pt-4 flex justify-end gap-2">
                             <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                             <Button type="submit" disabled={!incidentData.summary}>Log Incident</Button>
                        </div>
                    </div>
                 </form>
            );
        case 'submitted':
            return (
                <div className="text-center p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-green-400" fill="none" viewBox="0 0 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-xl font-bold mt-4">Incident Logged!</h2>
                    <p className="text-gray-400">The incident has been saved to the student's record.</p>
                </div>
            );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg relative p-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white" disabled={recordingState === 'recording'}>
            <CloseIcon />
        </button>
        {renderContent()}
      </div>
    </div>
  );
};

export default IncidentModal;