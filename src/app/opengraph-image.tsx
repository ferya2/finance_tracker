import { ImageResponse } from "next/og";

export const alt = "Finance Tracker — Take control of your money, beautifully";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#fafafa",
          color: "#09090b",
          fontFamily: "sans-serif",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              width: "48px",
              height: "48px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "14px",
              backgroundColor: "#059669",
              color: "#ffffff",
              fontSize: "22px",
              fontWeight: 700,
            }}
          >
            FT
          </div>
          <div style={{ display: "flex", fontSize: "26px", fontWeight: 600 }}>
            Finance Tracker
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "72px",
              fontWeight: 700,
              letterSpacing: "-3px",
              lineHeight: 1.05,
            }}
          >
            Take control of your money,
          </div>
          <div
            style={{
              display: "flex",
              color: "#059669",
              fontSize: "72px",
              fontWeight: 700,
              letterSpacing: "-3px",
              lineHeight: 1.05,
            }}
          >
            beautifully.
          </div>
          <div
            style={{
              display: "flex",
              color: "#52525b",
              fontSize: "28px",
              marginTop: "16px",
            }}
          >
            Track income, budget smarter, and understand your spending.
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {["Track", "Budget", "Grow"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 20px",
                borderRadius: "999px",
                backgroundColor: "#d1fae5",
                color: "#065f46",
                fontSize: "20px",
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
