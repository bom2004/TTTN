import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptured: (image: string) => void;
  isLoading: boolean;
}

const CameraModal: React.FC<CameraModalProps> = ({ 
  isOpen, 
  onClose, 
  onCaptured,
  isLoading
}) => {
  const [tempImage, setTempImage] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) setTempImage(imageSrc);
  }, [webcamRef]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[40px] overflow-hidden w-full max-w-sm shadow-2xl border border-white/10">
        <div className="p-8 bg-[#003580] text-white flex justify-between items-center">
            <div className="text-left">
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Xác thực khuôn mặt</h3>
                <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest mt-1">Hệ thống AI nhận diện</p>
            </div>
            <button onClick={() => { setTempImage(null); onClose(); }} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all hover:rotate-90">
                <span className="material-symbols-outlined">close</span>
            </button>
        </div>
        
        <div className="p-8 flex flex-col items-center">
          <div className="w-full aspect-square bg-slate-100 rounded-3xl overflow-hidden mb-8 border-4 border-slate-200 relative group">
            {!tempImage ? (
              <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" videoConstraints={{ facingMode: "user" }} />
            ) : (
              <img src={tempImage} alt="Selfie" className="w-full h-full object-cover blur-[0.5px] group-hover:blur-0 transition-all duration-700" />
            )}
            
            {!tempImage && (
              <div className="absolute inset-0 border-[40px] border-black/10 rounded-full flex items-center justify-center pointer-events-none">
                <div className="w-52 h-52 border-2 border-white/30 border-dashed rounded-full animate-spin-slow"></div>
              </div>
            )}
            
            <div className="absolute top-4 left-4 flex gap-2">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Recording</span>
            </div>
          </div>

          <div className="flex gap-4 w-full">
            {!tempImage ? (
              <button 
                onClick={handleCapture}
                className="flex-1 py-5 bg-[#003580] text-white font-black rounded-2xl hover:bg-[#002a6b] transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                Chụp ảnh ngay
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setTempImage(null)}
                  className="flex-1 py-5 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 group"
                >
                  <span className="material-symbols-outlined text-lg group-hover:rotate-180 transition-transform">autorenew</span>
                  Chụp lại
                </button>
                <button 
                  onClick={() => onCaptured(tempImage)}
                  disabled={isLoading}
                  className="flex-[2] py-5 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all shadow-xl flex items-center justify-center gap-2 shadow-emerald-500/20 active:scale-95 disabled:grayscale"
                >
                  {isLoading ? (
                    <span className="animate-pulse">Đang định vị & lưu...</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">verified</span>
                      Xác nhận lưu
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
