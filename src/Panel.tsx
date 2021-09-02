import * as React from "react";
import { useCallback, useEffect, useRef } from "react";

export type onWindowResizeArgs = {
	panelID: number;
	size: {x: number ; y: number ;};
	callback?: () => void;
};
export type PanelProps = {
	panelID: number;
	style: React.CSSProperties;
	resize?: "fixed" | "dynamic" | "stretch";
	onWindowResize?: (args: onWindowResizeArgs) => void;
};
export const Panel: React.FC<PanelProps> = React.memo(({ children, style, resize, onWindowResize, panelID }) =>
{
	const refResizeObject = useRef<HTMLObjectElement>(null);
	const styleResizeObject: React.CSSProperties = {
		position: "absolute",
		top: 0,
		left: 0,
		width: "100%",
		height: "100%",
		zIndex: -1,
		opacity: 0
	};
	const resizeObject = resize === "stretch" ? <object aria-label="panel" style={styleResizeObject} ref={refResizeObject} type="text/html" key={`resize-object-${panelID}`} /> : null;
	const ref = useRef<HTMLDivElement>(null);

	const calculateStretchWidth = useCallback(() =>
	{
		if (onWindowResize && ref.current)
		{
			const rect = ref.current.getBoundingClientRect();
			onWindowResize({
				panelID,
				size: { x: rect.width, y: rect.height },
				callback: void 0
			});
		}
	}, [ref.current, onWindowResize, panelID]);

	const onResizeObjectLoad = useCallback(() =>
	{
		if (refResizeObject && refResizeObject.current && refResizeObject.current.contentDocument && refResizeObject.current.contentDocument.defaultView)
		{
			refResizeObject.current.contentDocument.defaultView.addEventListener("resize", () =>
				calculateStretchWidth()
			);
		}
	}, [refResizeObject.current, calculateStretchWidth]);

	useEffect(() =>
	{
		if (resize === "stretch" && refResizeObject && refResizeObject.current)
		{
			refResizeObject.current.addEventListener("load", () => onResizeObjectLoad());
			refResizeObject.current.data = "about:blank";
			calculateStretchWidth();
		}
	}, [refResizeObject.current, onResizeObjectLoad, calculateStretchWidth]);

	return <div ref={ref} className="panelWrapper" style={style}>
		{resizeObject}
		{children}
	</div>;
});
