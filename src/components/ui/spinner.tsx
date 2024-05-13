import React from "react";

const Spinner = ({ color }: { color?: string }) => (
  <div className="spinner">
    <style jsx>{`
      .spinner {
        border: 2px solid rgba(0, 0, 0, 0.1);
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border-left-color: ${color ? color : "#12BB4F"};
        animation: spin 1s ease infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `}</style>
  </div>
);

export default Spinner;
