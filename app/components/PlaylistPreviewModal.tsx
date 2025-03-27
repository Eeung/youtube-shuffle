'use client'
import { useEffect, useState } from 'react';

interface VideoData {
    title: string;
    channelTitle: string;
}

interface PlaylistPreviewModalProps {
    open: boolean;
    onClose: () => void;
    onStartShuffle: () => void;
    onSetupCoupling: () => void;
    videos: VideoData[];
    title: string;
    description: string;
    thumbnail: string;
}

export default function PlaylistPreviewModal({
    open,
    onClose,
    onStartShuffle,
    onSetupCoupling,
    videos,
    title,
    description,
    thumbnail
}: PlaylistPreviewModalProps) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.5)] flex items-center justify-center">
            <section className="bg-white rounded-xl p-6 w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg">
                <header className="flex mb-2">
                    <div><img src={thumbnail} alt="Not Found" className="rounded-full size-12 mr-2"/></div>
                    <div>
                        <h2 className="text-2xl font-bold mb-2">{title}</h2>
                        <p className="text-sm text-gray-500">{description}</p>
                    </div>
                </header>
                <ul className="border rounded p-2 mb-4 max-h-[400px] shadow overflow-y-auto">
                    {videos.map((video, index) => (
                        <li key={index} className="flex items-center border-b last:border-none py-1">
                            <div className="h-fit pb-1 inline-block text-4xl mr-2 ">{index+1}</div>
                            <div className="inline-block">
                                <div className="font-semibold">{video.title}</div>
                                <div className="text-sm text-gray-500">{video.channelTitle}</div>
                            </div>
                        </li>
                    ))}
                </ul>
                <footer className="flex justify-end gap-2 mt-2">
                    <button onClick={onSetupCoupling} className="text-sm bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">고정 규칙 설정</button>
                    <button onClick={onStartShuffle} className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">셔플 시작</button>
                    <button onClick={onClose} className="text-sm border border-gray-400 px-3 py-1 rounded hover:bg-gray-100">취소</button>
                </footer>
            </section>
        </div>
    );
}