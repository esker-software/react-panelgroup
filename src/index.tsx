import * as React from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Divider, DividerSharedProps } from "./Divider";
import { Panel, onWindowResizeArgs } from "./Panel";

export type PanelGroupProps = DividerSharedProps & {
	panelColor?: string;
	panelWidths?: Array<PanelWidth | null>;
	onUpdate?: (data: Array<PanelWidth>) => void;
};

export type PanelWidth = {
	size: number;
	fixedSize?: number;
	minSize: number;
	maxSize: number;
	resize: "dynamic" | "stretch" | "fixed";
	snap?: Array<number>;
	style?: React.CSSProperties;
};
const PanelGroup: React.FC<PanelGroupProps> = React.memo(({ spacing = 1, panelWidths = [], children, direction = "row", panelColor, borderColor, showHandles = false, onResizeEnd, onResizeStart }) =>
{
	const getSizeDirection = useCallback((caps: boolean) =>
	{
		if (caps)
		{
			return direction === "column" ? "Height" : "Width";
		}
		return direction === "column" ? "height" : "width";
	}, [direction]);

	const initialChildren = useMemo(() => React.Children.toArray(children), [children]);

	const initPanels = useMemo(() =>
	{
		const panels: Array<PanelWidth> = [];

		if (children)
		{
			const defaultSize = 256;
			const defaultMinSize = 48;
			const defaultMaxSize = 0;
			const defaultResize = "stretch";
			let stretchIncluded = false;
			for (let i = 0; i < initialChildren.length; i++)
			{
				if (i < panelWidths.length && panelWidths[i])
				{
					panels.push({
						size: panelWidths[i]?.size ?? defaultSize,
						minSize: panelWidths[i]?.minSize ?? defaultMinSize,
						maxSize: panelWidths[i]?.maxSize ?? defaultMaxSize,
						resize: panelWidths[i]?.resize ?? panelWidths[i]?.resize ? "dynamic" : defaultResize,
						snap: panelWidths[i]?.snap ?? [],
						style: {
							...panelWidths[i]?.style || {}
						}
					});
				}
				else
				{
					panels.push({
						size: defaultSize,
						resize: defaultResize,
						minSize: defaultMinSize,
						maxSize: defaultMaxSize,
						snap: [],
						style: {}
					});
				}
				if (panels[i].resize === "stretch")
				{
					stretchIncluded = true;
				}
				if (!stretchIncluded && i === initialChildren.length - 1)
				{
					panels[i].resize = "stretch";
				}
			}
		}
		return panels;
	}, [children, panelWidths]);
	const [panels, setPanels] = useState<Array<PanelWidth>>(initPanels);

	const getPanelMinSize = useCallback((panelIndex: number): number =>
	{
		const panel = panels[panelIndex];
		if (panel.resize === "fixed")
		{
			if (!panel.fixedSize)
			{
				panel.fixedSize = panel.size;
			}
			return panel.fixedSize;
		}
		return panels[panelIndex].minSize;
	}, [panels]);

	const getPanelMaxSize = useCallback((panelIndex: number): number =>
	{
		const panel = panels[panelIndex];
		if (panel.resize === "fixed")
		{
			if (!panel.fixedSize)
			{
				panel.fixedSize = panel.size;
			}
			return panel.fixedSize;
		}
		return panels[panelIndex].maxSize;
	}, [panels]);


	const ref = useRef<HTMLDivElement>(null);

	const resizePanel = useCallback((panelID: number, delta: number, tempPanels: Array<PanelWidth>): number =>
	{
		const masterSize = tempPanels.map(c => c.size).reduce((a, c) => a + c, 0);
		if (!ref.current)
		{
			throw Error("lost ref.current");
		}
		const boundingRect = ref.current.getBoundingClientRect();

		const boundingSize = (direction === "column" ? boundingRect.height : boundingRect.width) - (spacing * (initialChildren.length - 1));

		const tempPanel = tempPanels[panelID];
		const tempPanel1 = tempPanels[panelID + 1];

		if (Math.abs(boundingSize - masterSize) <= 0.01)
		{
			tempPanel.size += boundingSize - masterSize;
		}
		let resultDelta = delta;

		tempPanel.size += delta;
		tempPanel1.size -= delta;
		let minsize = getPanelMinSize(panelID);
		let maxsize = getPanelMaxSize(panelID);
		if (tempPanel.size < minsize)
		{
			delta = minsize - tempPanel.size;
			if (panelID === 0)
			{
				resultDelta = resizePanel(panelID, delta, tempPanels);
			}
			else
			{
				resultDelta = resizePanel(panelID - 1, -delta, tempPanels);
			}
		}
		if (maxsize !== 0 && tempPanel.size > maxsize)
		{
			delta = tempPanel.size - maxsize;
			if (panelID === 0)
			{
				resultDelta = resizePanel(panelID, -delta, tempPanels);
			}
			else
			{
				resultDelta = resizePanel(panelID - 1, delta, tempPanels);
			}
		}
		minsize = getPanelMinSize(panelID + 1);
		maxsize = getPanelMaxSize(panelID + 1);
		if (tempPanel1.size < minsize)
		{
			delta = minsize - tempPanel1.size;
			if (panelID + 1 === tempPanels.length - 1)
			{
				resultDelta = resizePanel(panelID, -delta, tempPanels);
			}
			else
			{
				resultDelta = resizePanel(panelID + 1, delta, tempPanels);
			}
		}
		if (maxsize !== 0 && tempPanel1.size > maxsize)
		{
			delta = tempPanel1.size - maxsize;
			if (panelID + 1 === tempPanels.length - 1)
			{
				resultDelta = resizePanel(panelID, delta, tempPanels);
			}
			else
			{
				resultDelta = resizePanel(panelID + 1, -delta, tempPanels);
			}
		}
		if (tempPanel.snap)
		{
			for (let i = 0; i < tempPanel.snap.length; i++)
			{
				if (Math.abs(tempPanel.snap[i] - tempPanel.size) < 20)
				{
					delta = tempPanel.snap[i] - tempPanel.size;
					if (delta !== 0 && tempPanel.size + delta >= getPanelMinSize(panelID) && tempPanel1.size - delta >= getPanelMinSize(panelID + 1))
					{
						resultDelta = resizePanel(panelID, delta, tempPanels);
					}
				}
			}
		}
		if (tempPanel1.snap)
		{
			for (let i = 0; i < tempPanel1.snap.length; i++)
			{
				if (Math.abs(tempPanel1.snap[i] - tempPanel1.size) < 20)
				{
					delta = tempPanel1.snap[i] - tempPanel1.size;
					if (delta !== 0 && tempPanel.size + delta >= getPanelMinSize(panelID) && tempPanel1.size - delta >= getPanelMinSize(panelID + 1))
					{
						resultDelta = resizePanel(panelID, -delta, tempPanels);
					}
				}
			}
		}
		return resultDelta;
	}, [ref.current, getPanelMinSize, getPanelMaxSize, initialChildren.length]);


	const handleResize = useCallback((panelID: number, delta: { x: number; y: number; }) =>
	{
		const tempPanels = panels.slice();
		const returnDelta = resizePanel(
			panelID,
			direction === "row" ? delta.x : delta.y,
			tempPanels
		);
		setPanels(tempPanels);
		return returnDelta;
	}, [panels, resizePanel, direction]);

	const onWindowResize = useCallback(({ panelID, size, callback }: onWindowResizeArgs) =>
	{
		const newSize = direction === "column" ? size.y : size.x;
		if (newSize !== panels[panelID].size)
		{
			const tempPanels = panels.slice();
			if (newSize < tempPanels[panelID].minSize)
			{
				let diff = tempPanels[panelID].minSize - newSize;
				tempPanels[panelID].size = tempPanels[panelID].minSize;
				for (let i = 0; i < tempPanels.length; i += 1)
				{
					if (i !== panelID && tempPanels[i].resize === "dynamic")
					{
						const available = tempPanels[i].size - tempPanels[i].minSize;
						const cut = Math.min(diff, available);
						tempPanels[i].size -= cut;
						diff -= cut;
						// eslint-disable-next-line max-depth
						if (diff === 0)
						{
							break;
						}
					}
				}
			}
			else
			{
				tempPanels[panelID].size = newSize;
			}
			setPanels(tempPanels);
			if (panelID > 0)
			{
				handleResize(panelID - 1, { x: 0, y: 0 });
			}
			else if (panels.length > 2)
			{
				handleResize(panelID + 1, { x: 0, y: 0 });
			}
			if (callback)
			{
				callback();
			}
		}
	}, [panels, handleResize]);


	const newChildren: Array<JSX.Element> = useMemo(() =>
	{
		const newChildrenInternal: Array<JSX.Element> = [];
		initialChildren.forEach((_, i) =>
		{
			const panel = panels[i];
			const style: React.CSSProperties = {
				[getSizeDirection(false)]: panel.size,
				[direction === "row" ? "height" : "width"]: "100%",
				[`min${getSizeDirection(true)}`]: panel.resize === "stretch" ? 0 : panel.size,
				flexGrow: panel.resize === "stretch" ? 1 : 0,
				flexShrink: panel.resize === "stretch" ? 1 : 0,
				display: "flex",
				overflow: "hidden",
				position: "relative",
				backgroundColor: panelColor ?? "inherit",
				...panel.style
			};
			const panelProps = {
				style,
				panelID: i,
				resize: panel.resize,
				onWindowResize: panel.resize === "stretch" ? onWindowResize : void 0
			};
			newChildrenInternal.push(<Panel {...panelProps} key={`panel-fragment-${i}`}> {initialChildren[i]} </Panel>);
			if (i < initialChildren.length - 1)
			{
				newChildrenInternal.push(<Divider
					borderColor={borderColor}
					panelID={i}
					handleResize={handleResize}
					spacing={spacing}
					direction={direction}
					showHandles={showHandles}
					onResizeStart={onResizeStart}
					onResizeEnd={onResizeEnd}
					key={`divider-fragment-${i}`}
				/>);
			}
		});
		return newChildrenInternal;
	}, [panels, onWindowResize, handleResize]);


	const panelGroupMinSize = useMemo(() => panels.map((_, i) => getPanelMinSize(i)).reduce((a, c) => a + c, 0) + ((panels.length - 1) * spacing), [panels]);
	const style = {
		width: "100%",
		height: "100%",
		[`min${getSizeDirection(true)}`]: panelGroupMinSize,
		display: "flex",
		flexDirection: direction,
		flexGrow: 1
	};
	return <div className="panelGroup" style={style} ref={ref}>{newChildren}</div>;
});

export default PanelGroup;
PanelGroup.displayName = "PanelGroup";