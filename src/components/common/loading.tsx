import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/loading.json';

export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
      <div className="p-3">
        <Lottie
          animationData={loadingAnimation}
          loop={true}
          style={{ width: 200, height: 200 }}
        />
      </div>
    </div>
  );
}
