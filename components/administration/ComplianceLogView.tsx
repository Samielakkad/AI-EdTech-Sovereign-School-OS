import React, { useState, useEffect } from 'react';
import { ComplianceLogEntry } from '../../types.ts';
import * as complianceLogService from '../../services/complianceLogService.ts';

const SchoolArchiveView: React.FC = () => {
    const [logs, setLogs] = useState<ComplianceLogEntry[]>([]);

    useEffect(() => {
        setLogs(complianceLogService.getLogs());
    }, []);

    return (
        <div className="p-6 h-full flex flex-col">
            <header className="mb-6">
                <h1 className="text-3xl font-bold">Compliance Log</h1>
                <p className="text-gray-400">An immutable log of key actions taken within the system.</p>
            </header>
            <div className="bg-gray-800 rounded-lg shadow-lg flex-1 overflow-y-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">Timestamp</th>
                            <th scope="col" className="px-6 py-3">User/System</th>
                            <th scope="col" className="px-6 py-3">Action</th>
                            <th scope="col" className="px-6 py-3">Details</th>
                            <th scope="col" className="px-6 py-3">Approved By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-6 py-4 font-medium whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="px-6 py-4">{log.user}</td>
                                <td className="px-6 py-4 font-semibold">{log.action}</td>
                                <td className="px-6 py-4 max-w-sm truncate" title={log.details}>{log.details}</td>
                                <td className="px-6 py-4">{log.approvedBy || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SchoolArchiveView;