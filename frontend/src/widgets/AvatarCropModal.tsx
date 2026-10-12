import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type Props = {
  file: File;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (file: File) => void | Promise<void>;
};

const STAGE = 320;
const OUT_SIZE = 512;
const MIN_DIAMETER = 96;
const MAX_DIAMETER = 280;

type Layout = {
  imgLeft: number;
  imgTop: number;
  dispW: number;
  dispH: number;
  naturalW: number;
  naturalH: number;
};

function computeLayout(naturalW: number, naturalH: number): Layout {
  const scale = Math.min(STAGE / naturalW, STAGE / naturalH);
  const dispW = naturalW * scale;
  const dispH = naturalH * scale;
  return {
    imgLeft: (STAGE - dispW) / 2,
    imgTop: (STAGE - dispH) / 2,
    dispW,
    dispH,
    naturalW,
    naturalH,
  };
}

export function AvatarCropModal({ file, busy, onCancel, onConfirm }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [diameter, setDiameter] = useState(180);
  const [center, setCenter] = useState({ x: STAGE / 2, y: STAGE / 2 });
  const [error, setError] = useState<string | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const clampCenter = (x: number, y: number, d: number, lay: Layout) => {
    const r = d / 2;
    const minX = lay.imgLeft + r;
    const maxX = lay.imgLeft + lay.dispW - r;
    const minY = lay.imgTop + r;
    const maxY = lay.imgTop + lay.dispH - r;
    return {
      x: Math.min(Math.max(x, minX), Math.max(minX, maxX)),
      y: Math.min(Math.max(y, minY), Math.max(minY, maxY)),
    };
  };

  const onImageLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const lay = computeLayout(img.naturalWidth, img.naturalHeight);
    setLayout(lay);
    const d = Math.min(MAX_DIAMETER, Math.max(MIN_DIAMETER, Math.min(lay.dispW, lay.dispH) * 0.72));
    setDiameter(d);
    setCenter(clampCenter(STAGE / 2, STAGE / 2, d, lay));
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!layout || busy) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: center.x,
      originY: center.y,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId || !layout) return;
    const next = clampCenter(
      drag.originX + (e.clientX - drag.startX),
      drag.originY + (e.clientY - drag.startY),
      diameter,
      layout,
    );
    setCenter(next);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  };

  const onDiameterChange = (value: number) => {
    if (!layout) return;
    const d = Math.min(MAX_DIAMETER, Math.max(MIN_DIAMETER, value));
    setDiameter(d);
    setCenter((c) => clampCenter(c.x, c.y, d, layout));
  };

  const maskStyle = useMemo(() => {
    const r = diameter / 2;
    return {
      background: `radial-gradient(circle ${r}px at ${center.x}px ${center.y}px, transparent ${r - 1}px, rgba(14, 32, 66, 0.55) ${r}px)`,
    };
  }, [center.x, center.y, diameter]);

  const exportCropped = async () => {
    const img = imgRef.current;
    if (!img || !layout) return;
    setError(null);
    const scale = layout.naturalW / layout.dispW;
    const rDisp = diameter / 2;
    const nx = (center.x - layout.imgLeft) * scale;
    const ny = (center.y - layout.imgTop) * scale;
    const nr = rDisp * scale;
    const sx = Math.max(0, nx - nr);
    const sy = Math.max(0, ny - nr);
    const sSize = Math.min(nr * 2, layout.naturalW - sx, layout.naturalH - sy);

    const canvas = document.createElement("canvas");
    canvas.width = OUT_SIZE;
    canvas.height = OUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Could not crop image");
      return;
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUT_SIZE, OUT_SIZE);
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUT_SIZE, OUT_SIZE);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
    );
    if (!blob) {
      setError("Could not export image");
      return;
    }
    const base = file.name.replace(/\.[^.]+$/, "") || "avatar";
    const cropped = new File([blob], `${base}-avatar.jpg`, { type: "image/jpeg" });
    await onConfirm(cropped);
  };

  return (
    <div className="acc-modal-backdrop" role="presentation" onClick={busy ? undefined : onCancel}>
      <div
        className="acc-modal settings-modal avatar-crop"
        role="dialog"
        aria-modal="true"
        aria-label="Edit profile photo"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="settings-modal__title">Edit photo</h2>
        <p className="avatar-crop__hint">Drag the circle to frame your face, then save.</p>

        <div className="avatar-crop__stage" style={{ width: STAGE, height: STAGE }}>
          {src && (
            <img
              ref={imgRef}
              className="avatar-crop__image"
              src={src}
              alt=""
              draggable={false}
              onLoad={onImageLoad}
            />
          )}
          <div className="avatar-crop__mask" style={maskStyle} aria-hidden />
          <div
            className="avatar-crop__circle"
            style={{
              width: diameter,
              height: diameter,
              left: center.x - diameter / 2,
              top: center.y - diameter / 2,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            role="slider"
            aria-label="Crop circle position"
            aria-valuetext={`${Math.round(center.x)}, ${Math.round(center.y)}`}
          />
        </div>

        <label className="avatar-crop__zoom">
          <span>Circle size</span>
          <input
            type="range"
            min={MIN_DIAMETER}
            max={MAX_DIAMETER}
            value={Math.round(diameter)}
            disabled={!layout || busy}
            onChange={(e) => onDiameterChange(Number(e.target.value))}
          />
        </label>

        {error && <p className="settings-field-error">{error}</p>}

        <div className="confirm-modal__actions">
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!layout || busy}
            onClick={() => void exportCropped()}
          >
            {busy ? "Saving…" : "Save photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
