import React from "react";

export function App() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100vw",
        height: "100vh",
        background: "radial-gradient(circle at 50% 50%, #0a192f 0%, #020c1b 100%)",
        fontFamily: "'Space Grotesk', sans-serif",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
      }}
    >
      <style>{`
        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background-color: #020c1b;
        }
      `}</style>
      <h1
        style={{
          fontSize: "40px",
          fontWeight: 700,
          background: "linear-gradient(90deg, #38bdf8 0%, #2563eb 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "1px",
          margin: 0,
        }}
      >
        Coming Soon....
      </h1>
    </div>
  );
}
