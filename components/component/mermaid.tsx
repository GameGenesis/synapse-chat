import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";

mermaid.initialize({
    startOnLoad: true,
    theme: "dark",
    securityLevel: "loose",
    fontFamily: "Fira Code, monospace",
    themeVariables: {
        background: "#2D3748",
        primaryColor: "#4FD1C5",
        secondaryColor: "#63B3ED",
        tertiaryColor: "#F687B3",
        primaryBorderColor: "#81E6D9",
        secondaryBorderColor: "#90CDF4",
        tertiaryBorderColor: "#FBB6CE",
        primaryTextColor: "#E2E8F0",
        secondaryTextColor: "#CBD5E0",
        tertiaryTextColor: "#E2E8F0",
        lineColor: "#718096",
        textColor: "#E2E8F0",
        mainBkg: "#4A5568",
        secondBkg: "#2D3748",
        mainContrastColor: "#E2E8F0",
        darkTextColor: "#1A202C",
        nodeBorder: "#81E6D9",
        clusterBkg: "#4A5568",
        clusterBorder: "#81E6D9",
        defaultLinkColor: "#CBD5E0",
        titleColor: "#F7FAFC",
        edgeLabelBackground: "#4A5568",
        actorBorder: "#81E6D9",
        actorBkg: "#4A5568",
        actorTextColor: "#E2E8F0",
        actorLineColor: "#CBD5E0",
        signalColor: "#CBD5E0",
        signalTextColor: "#E2E8F0",
        labelBoxBkgColor: "#4A5568",
        labelBoxBorderColor: "#81E6D9",
        labelTextColor: "#E2E8F0",
        loopTextColor: "#E2E8F0",
        noteBorderColor: "#81E6D9",
        noteBkgColor: "#4A5568",
        noteTextColor: "#E2E8F0",
        activationBorderColor: "#81E6D9",
        activationBkgColor: "#4A5568",
        sequenceNumberColor: "#E2E8F0",
        sectionBkgColor: "#4A5568",
        altSectionBkgColor: "#2D3748",
        sectionBkgColor2: "#2D3748",
        excludeBkgColor: "#2D3748",
        taskBorderColor: "#81E6D9",
        taskBkgColor: "#4A5568",
        taskTextLightColor: "#E2E8F0",
        taskTextColor: "#E2E8F0",
        taskTextDarkColor: "#1A202C",
        taskTextOutsideColor: "#E2E8F0",
        taskTextClickableColor: "#F7FAFC",
        activeTaskBorderColor: "#F687B3",
        activeTaskBkgColor: "#553C9A",
        gridColor: "#718096",
        doneTaskBkgColor: "#2D3748",
        doneTaskBorderColor: "#CBD5E0",
        critBorderColor: "#F687B3",
        critBkgColor: "#553C9A",
        todayLineColor: "#F687B3",
        personBorder: "#81E6D9",
        personBkg: "#4A5568"
    }
});

interface Props {
    chart: string;
}

export const Mermaid = ({ chart }: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        mermaid.contentLoaded();
    }, []);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const newScale = scale + (e.deltaY > 0 ? -0.1 : 0.1);
        setScale(Math.max(0.5, Math.min(newScale, 3))); // Limit scale between 0.5 and 3
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent default behavior
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        if (containerRef.current) {
            containerRef.current.style.cursor = "grabbing";
            containerRef.current.style.userSelect = "none";
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (containerRef.current) {
            containerRef.current.style.cursor = "move";
            containerRef.current.style.userSelect = "auto";
        }
    };

    return (
        <div
            ref={containerRef}
            style={{
                overflow: "hidden",
                width: "100%",
                height: "100%",
                cursor: "move"
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="bg-grey-100"
        >
            <div
                className="mermaid"
                style={{
                    transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                    transformOrigin: "0 0",
                    transition: isDragging ? "none" : "transform 0.1s"
                }}
            >
                {chart}
            </div>
        </div>
    );
};
