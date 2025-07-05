'use client';



import { useUser } from '@clerk/nextjs';
import React, { useEffect, useRef, useState } from 'react'


const PhotoCapture = ({  onBack }) => {
    const { user } = useUser();
    const username = user?.username || user?.firstName || user?.id;
    const photoref = useRef(null);
    const canvasRef = useRef(null);
    const [filter, setFilter] = useState("none");
  

    const filters  = {
        none: 'none',
        grayscale: 'grayscale(1)',
        sepia: 'sepia(1)',
        invert: 'invert(1)',
        blur: 'blur(4px)',
    };

    useEffect(()=>{
        async function camera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({video: true })
                if(photoref.current){
                    photoref.current.srcObject = stream
                }
            } catch (error) {
                console.log('Error accessing camera:', err);
            }
            
        }
        camera()
    })
    const CaptureImage = async() =>{
        const video = photoref.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        console.log("Resolution:", video.videoWidth, "x", video.videoHeight);
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.filter =  filters[filter];
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/png');
        console.log(imageData);
        if(user){
            
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: JSON.stringify({ imageData , username }),
                headers: { 'Content-Type': 'application/json' },
            });
            const result = await res.json();
            if (result.success){
                console.log('Photo saved to Supabase!');
            }else {
                alert('Failed to upload.');
            }
        } else {
            alert('User not signed in!');
        }
    };  


    
  return (
    <div className="p-4 flex flex-col items-center gap-4">
        {/* Live Camera Feed */}
        <video ref={photoref} autoPlay playsInline className="rounded border" style={{filter: filters[filter],transform: 'scaleX(-1)', width: '640px', height: '480px' }}></video>
         <div className="flex flex-wrap gap-2">
            {Object.keys(filters).map((key)=>(
                <button key={key} onClick={()=>(setFilter(key))} className={`px-3 py-1 rounded text-sm ${(filter === key) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`} >{key}</button>
            ))}
         </div>
        {/* Hidden Canvas for Processing */}
        <canvas ref={canvasRef} className='hidden'/>
        {/* Action Buttons */}
        
        <div>
            <button onClick={CaptureImage} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">Capture Photo</button>
        </div>
    </div>
  )
}

export default PhotoCapture
