/**
 * High-performance Client-side Image Lighting, Color & Quality Analyzer
 * Evaluates histograms, perceived luminance, dynamic range, and calculates
 * optimal AI auto-enhancement parameters without sending raw images over network.
 */

export interface ImageAnalysisResult {
  brightness: number; // 0 to 255
  contrast: number; // 0 to 100
  saturation: number; // 0 to 100
  colorTemperature: "COOL" | "NEUTRAL" | "WARM";
  exposureStatus: "UNDEREXPOSED" | "BALANCED" | "OVEREXPOSED";
  contrastStatus: "LOW" | "BALANCED" | "HIGH";
  colorStatus: "MUTED" | "NATURAL" | "VIBRANT";
  overallScore: number; // 0 to 100
  needsEnhancement: boolean;
  tag: string;
  recommendedSettings: {
    brightness: number; // -100 to +100
    contrast: number; // -100 to +100
    saturation: number; // -100 to +100
    warmth: number; // -100 to +100
    exposure: number; // -100 to +100
    shadows: number; // 0 to 100
    highlights: number; // -100 to 0
    clarity: number; // 0 to 100
  };
}

export async function analyzeImage(imageInput: string | HTMLImageElement): Promise<ImageAnalysisResult> {
  return new Promise((resolve) => {
    const processImage = (img: HTMLImageElement) => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        // Scale down to max 320x320 for sub-5ms processing
        const maxDim = 320;
        let width = img.naturalWidth || img.width || 320;
        let height = img.naturalHeight || img.height || 240;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = Math.max(10, width);
        canvas.height = Math.max(10, height);

        if (!ctx) {
          resolve(getDefaultAnalysis());
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const totalPixels = width * height;

        let totalLuminance = 0;
        let totalRed = 0;
        let totalGreen = 0;
        let totalBlue = 0;
        let totalSaturation = 0;
        let darkPixelsCount = 0; // < 30
        let brightPixelsCount = 0; // > 225

        const luminanceArray = new Float32Array(totalPixels);

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Perceived luminance (ITU-R BT.709 standard)
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          luminanceArray[i / 4] = lum;
          totalLuminance += lum;

          totalRed += r;
          totalGreen += g;
          totalBlue += b;

          if (lum < 35) darkPixelsCount++;
          if (lum > 220) brightPixelsCount++;

          // Compute saturation
          const max = Math.max(r, g, b) / 255;
          const min = Math.min(r, g, b) / 255;
          const delta = max - min;
          let sat = 0;
          if (max !== 0) {
            sat = (delta / max) * 100;
          }
          totalSaturation += sat;
        }

        const avgLuminance = totalLuminance / totalPixels;
        const avgSaturation = totalSaturation / totalPixels;
        const avgRed = totalRed / totalPixels;
        const avgBlue = totalBlue / totalPixels;

        // Calculate standard deviation (RMS Contrast)
        let sumSquaredDiff = 0;
        for (let i = 0; i < totalPixels; i++) {
          const diff = luminanceArray[i] - avgLuminance;
          sumSquaredDiff += diff * diff;
        }
        const rmsContrast = Math.sqrt(sumSquaredDiff / totalPixels);

        // Classify Metrics
        const darkRatio = darkPixelsCount / totalPixels;
        const brightRatio = brightPixelsCount / totalPixels;

        let exposureStatus: "UNDEREXPOSED" | "BALANCED" | "OVEREXPOSED" = "BALANCED";
        if (avgLuminance < 85 || darkRatio > 0.35) {
          exposureStatus = "UNDEREXPOSED";
        } else if (avgLuminance > 185 || brightRatio > 0.35) {
          exposureStatus = "OVEREXPOSED";
        }

        let contrastStatus: "LOW" | "BALANCED" | "HIGH" = "BALANCED";
        if (rmsContrast < 40) {
          contrastStatus = "LOW";
        } else if (rmsContrast > 75) {
          contrastStatus = "HIGH";
        }

        let colorStatus: "MUTED" | "NATURAL" | "VIBRANT" = "NATURAL";
        if (avgSaturation < 22) {
          colorStatus = "MUTED";
        } else if (avgSaturation > 60) {
          colorStatus = "VIBRANT";
        }

        let colorTemp: "COOL" | "NEUTRAL" | "WARM" = "NEUTRAL";
        if (avgRed > avgBlue + 15) {
          colorTemp = "WARM";
        } else if (avgBlue > avgRed + 15) {
          colorTemp = "COOL";
        }

        // Determine if Auto-Enhance is recommended
        const needsEnhancement =
          exposureStatus !== "BALANCED" ||
          contrastStatus === "LOW" ||
          colorStatus === "MUTED";

        let tag = "Balanced Photo";
        if (exposureStatus === "UNDEREXPOSED") {
          tag = "Low Light • Boost Recommended";
        } else if (exposureStatus === "OVEREXPOSED") {
          tag = "High Highlights • Recovery Ready";
        } else if (contrastStatus === "LOW") {
          tag = "Flat Contrast • Enhance Ready";
        } else if (colorStatus === "MUTED") {
          tag = "Muted Colors • Vibrancy Boost";
        }

        // Calculate Auto-Enhancement slider recipes
        let recBrightness = 0;
        let recExposure = 0;
        let recShadows = 0;
        let recHighlights = 0;
        let recContrast = 0;
        let recSaturation = 0;
        let recWarmth = 0;
        let recClarity = 15;

        // 1. Exposure & Brightness compensation
        if (exposureStatus === "UNDEREXPOSED") {
          const deficit = (120 - avgLuminance);
          recBrightness = Math.round(Math.min(35, deficit * 0.4));
          recExposure = Math.round(Math.min(30, deficit * 0.35));
          recShadows = Math.round(Math.min(45, darkRatio * 80));
        } else if (exposureStatus === "OVEREXPOSED") {
          const excess = avgLuminance - 140;
          recBrightness = Math.round(Math.max(-25, -excess * 0.3));
          recHighlights = Math.round(Math.max(-40, -brightRatio * 70));
        }

        // 2. Contrast compensation
        if (contrastStatus === "LOW") {
          recContrast = Math.round(Math.min(30, (50 - rmsContrast) * 0.9));
        } else if (contrastStatus === "HIGH") {
          recContrast = -10;
        } else {
          recContrast = 10;
        }

        // 3. Saturation & Vibrancy boost
        if (colorStatus === "MUTED") {
          recSaturation = Math.round(Math.min(35, (30 - avgSaturation) * 1.5));
        } else if (colorStatus === "NATURAL") {
          recSaturation = 12;
        }

        // 4. White Balance (Warmth) neutralization
        if (colorTemp === "COOL") {
          recWarmth = 15;
        } else if (colorTemp === "WARM" && avgRed > avgBlue + 25) {
          recWarmth = -10;
        }

        // Calculate overall quality score (0 - 100)
        let score = 100;
        if (exposureStatus !== "BALANCED") score -= 25;
        if (contrastStatus !== "BALANCED") score -= 15;
        if (colorStatus === "MUTED") score -= 15;

        resolve({
          brightness: Math.round(avgLuminance),
          contrast: Math.round(rmsContrast),
          saturation: Math.round(avgSaturation),
          colorTemperature: colorTemp,
          exposureStatus,
          contrastStatus,
          colorStatus,
          overallScore: Math.max(20, score),
          needsEnhancement,
          tag,
          recommendedSettings: {
            brightness: recBrightness,
            contrast: recContrast,
            saturation: recSaturation,
            warmth: recWarmth,
            exposure: recExposure,
            shadows: recShadows,
            highlights: recHighlights,
            clarity: recClarity,
          },
        });
      } catch (e) {
        resolve(getDefaultAnalysis());
      }
    };

    if (typeof imageInput !== "string") {
      processImage(imageInput);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => processImage(img);
    img.onerror = () => {
      // Retry without crossOrigin
      const fallback = new Image();
      fallback.onload = () => processImage(fallback);
      fallback.onerror = () => resolve(getDefaultAnalysis());
      fallback.src = imageInput;
    };
    img.src = imageInput;
  });
}

function getDefaultAnalysis(): ImageAnalysisResult {
  return {
    brightness: 120,
    contrast: 50,
    saturation: 40,
    colorTemperature: "NEUTRAL",
    exposureStatus: "BALANCED",
    contrastStatus: "BALANCED",
    colorStatus: "NATURAL",
    overallScore: 85,
    needsEnhancement: false,
    tag: "Standard Lighting",
    recommendedSettings: {
      brightness: 10,
      contrast: 15,
      saturation: 15,
      warmth: 5,
      exposure: 10,
      shadows: 20,
      highlights: -10,
      clarity: 15,
    },
  };
}
