import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PanelWidth } from ".";

export type DividerSharedProps = {
	spacing: number;
	onResizeStart?: (data: Array<PanelWidth>) => void;
	onResizeEnd?: (data: Array<PanelWidth>) => void;
	showHandles?: boolean;
	borderColor?: string;
	direction?: "row" | "column";
};

export type DividerProps = DividerSharedProps & {
	handleBleed?: number;
	panelID: number;
	handleResize: (panelID: number, delta: { x: number; y: number; }) => number;
};

export const Divider: React.FC<DividerProps> = ({ onResizeStart, onResizeEnd, direction, handleResize, panelID, spacing, handleBleed = 4, showHandles, borderColor }) =>
{
	const [dragging, setDragging] = useState(false);
	const [initPos, setInitPos] = useState<{ x: number; y: number; }>({ x: 0, y: 0 });

	const handleDragMove = useCallback((e: Event, x: number, y: number) =>
	{
		if (!dragging)
		{
			return;
		}
		const initDelta = {
			x: x - initPos.x,
			y: y - initPos.y
		};

		const flowMask = {
			x: direction === "row" ? 1 : 0,
			y: direction === "column" ? 1 : 0
		};

		const flowDelta = (initDelta.x * flowMask.x) + (initDelta.y * flowMask.y);
		const resultDelta = handleResize(panelID, initDelta);
		if (resultDelta + flowDelta !== 0)
		{
			const expectedDelta = resultDelta === flowDelta;
			setInitPos({
				x: x + (expectedDelta ? 0 : resultDelta * flowMask.x),
				y: y + (expectedDelta ? 0 : resultDelta * flowMask.y)
			});
		}

		e.stopPropagation();
		e.preventDefault();
	}, [dragging, handleResize, initPos]);

	const onMouseMove = useCallback((e: MouseEvent) =>
	{
		handleDragMove(e, e.pageX, e.pageY);
	}, [handleDragMove]);

	const onTouchMove = useCallback((e: TouchEvent) =>
	{
		handleDragMove(e, e.touches[0].clientX, e.touches[0].clientY);
	}, [handleDragMove]);

	const handleDragStart = useCallback((e: Event, x: number, y: number) =>
	{
		setDragging(true);
		setInitPos({ x, y });
		e.stopPropagation();
		e.preventDefault();
	}, [setDragging, setInitPos]);

	const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
	{
		if (e.button === 0)
		{
			handleDragStart(e.nativeEvent, e.pageX, e.pageY);
		}
	}, [handleDragStart]);

	const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) =>
	{
		handleDragStart(e.nativeEvent, e.touches[0].clientX, e.touches[0].clientY);
	}, [handleDragStart]);


	const handleDragEnd = useCallback((e: Event) =>
	{
		setDragging(false);
		e.stopPropagation();
		e.preventDefault();
	}, [setDragging]);

	useEffect(() =>
	{
		if (dragging)
		{
			document.addEventListener("mousemove", onMouseMove);
			document.addEventListener("touchmove", onTouchMove, {
				passive: false
			});
			document.addEventListener("mouseup", handleDragEnd);
			document.addEventListener("touchend", handleDragEnd, {
				passive: false
			});
			if (onResizeStart)
			{
				onResizeStart([]);
			}
		}
		else
		{

			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("touchmove", onTouchMove);
			document.removeEventListener("mouseup", handleDragEnd);
			document.removeEventListener("touchend", handleDragEnd);
			if (onResizeEnd)
			{
				onResizeEnd([]);
			}
		}
		return () =>
		{
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("touchmove", onTouchMove);
			document.removeEventListener("mouseup", handleDragEnd);
			document.removeEventListener("touchend", handleDragEnd);
		};

	}, [dragging, onMouseMove, onTouchMove, handleDragEnd]);

	const getHandleWidth = useMemo(() => spacing + (handleBleed * 2), [spacing, handleBleed]);
	const getHandleOffset = useMemo(() => (spacing / 2) - (getHandleWidth / 2), [getHandleWidth, spacing]);

	const dividerStyle: React.CSSProperties = {
		width: direction === "row" ? spacing : "auto",
		minWidth: direction === "row" ? spacing : "auto",
		maxWidth: direction === "row" ? spacing : "auto",
		height: direction === "column" ? spacing : "auto",
		minHeight: direction === "column" ? spacing : "auto",
		maxHeight: direction === "column" ? spacing : "auto",
		flexGrow: 0,
		position: "relative",
		backgroundColor: borderColor
	};
	const handleStyle: React.CSSProperties = {
		position: "absolute",
		width: direction === "row" ? getHandleWidth : "100%",
		height: direction === "column" ? getHandleWidth : "100%",
		left: direction === "row" ? getHandleOffset : 0,
		top: direction === "column" ? getHandleOffset : 0,
		backgroundColor: showHandles ? "rgba(0,128,255,0.25)" : "auto",
		cursor: direction === "row" ? "col-resize" : "row-resize",
		zIndex: 100
	};
	return <div className={"divider" + (dragging ? " dragging" : "")} onMouseDown={onMouseDown} onTouchStart={onTouchStart} style={dividerStyle} >
		<div style={handleStyle} />
	</div>;
};