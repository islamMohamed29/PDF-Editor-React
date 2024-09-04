import React, { useRef, useState, useEffect } from "react";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import "bootstrap/dist/css/bootstrap.min.css";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { Stage, Layer, Circle, Rect, Line } from "react-konva";
import { PDFDocument, rgb } from "pdf-lib";

export default function PDFViewer() {
  const stageRef = useRef(null);
  const [pdfFile, setPDFFile] = useState(null);
  const [viewPdf, setViewPdf] = useState(null);
  const [drawingTool, setDrawingTool] = useState(null);
  const [shapes, setShapes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pdfDimensions, setPdfDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const fileType = ["application/pdf"];
  const handleChange = (e) => {
    let selectedFile = e.target.files[0];
    if (selectedFile) {
      if (fileType.includes(selectedFile.type)) {
        let reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = (e) => {
          setPDFFile(e.target.result);
        };
      } else {
        setPDFFile(null);
      }
    } else {
      console.log("please select pdf file");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setViewPdf(pdfFile);
  };

  const handleToolChange = (tool) => {
    setDrawingTool(tool);
  };

  const handleMouseDown = (e) => {
    if (drawingTool) {
      setIsDrawing(true);
      const pos = stageRef.current.getPointerPosition();
      setStartX(pos.x / zoom); // Adjust for zoom
      setStartY(pos.y / zoom); // Adjust for zoom
      console.log("Mouse Up Position:", pos);
    }
  };

  const handleMouseUp = async (e) => {
    if (isDrawing) {
      const pos = stageRef.current.getPointerPosition();
      console.log("Mouse Down Position:", pos);

      const shape = {
        tool: drawingTool,
        x: startX,
        y: startY,
        width: (pos.x - startX) / zoom,
        height: (pos.y - startY) / zoom,
      };
      setShapes([...shapes, shape]);
      setIsDrawing(false);

      if (pdfFile) {
        const existingPdfBytes = await fetch(pdfFile).then((res) =>
          res.arrayBuffer()
        );
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const page = pdfDoc.getPages()[0];

        shapes.forEach((shape) => {
          const adjustedX = shape.x * zoom;
          const adjustedY = shape.y * zoom;
          const adjustedWidth = shape.width * zoom;
          const adjustedHeight = shape.height * zoom;

          switch (shape.tool) {
            case "circle":
              page.drawEllipse({
                x: adjustedX + adjustedWidth / 2,
                y: adjustedY + adjustedHeight / 2,
                radiusX: Math.max(adjustedWidth, adjustedHeight) / 2,
                radiusY: Math.max(adjustedWidth, adjustedHeight) / 2,
                color: rgb(1, 0, 0),
              });
              break;
            case "rectangle":
              page.drawRectangle({
                x: adjustedX,
                y: adjustedY,
                width: adjustedWidth,
                height: adjustedHeight,
                color: rgb(0, 0, 1),
              });
              break;
            case "line":
              page.drawLine({
                start: { x: adjustedX, y: adjustedY },
                end: {
                  x: adjustedX + adjustedWidth,
                  y: adjustedY + adjustedHeight,
                },
                color: rgb(0, 1, 0),
                thickness: 2,
              });
              break;
            default:
              break;
          }
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "pdf-with-drawings.pdf";
        a.click();
      }
    }
  };
  const handleRenderSuccess = (page) => {
    const { width, height } = page.view;
    setPdfDimensions({ width, height });
  };

  const handleZoomChange = (newScale) => {
    setZoom(newScale);
  };
  const handleSavePDF = async () => {
    if (pdfFile) {
      const existingPdfBytes = await fetch(pdfFile).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const page = pdfDoc.getPages()[0];
      const { width: pdfWidth, height: pdfHeight } = page.getSize(); // Get actual page dimensions

      shapes.forEach((shape) => {
        console.log(shape, "shape");
        const adjustedX = shape.x * scale;
        const adjustedY = pdfHeight - (shape.y * scale + shape.height * scale); // Adjust Y-coordinate
        const adjustedWidth = shape.width * scale;
        const adjustedHeight = shape.height * scale;

        switch (shape.tool) {
          case "circle":
            page.drawEllipse({
              x: adjustedX + adjustedWidth / 2,
              y: adjustedY + adjustedHeight / 2,
              radiusX: Math.max(adjustedWidth, adjustedHeight) / 2,
              radiusY: Math.max(adjustedWidth, adjustedHeight) / 2,
              color: rgb(1, 0, 0),
            });
            break;
          case "rectangle":
            page.drawRectangle({
              x: adjustedX,
              y: adjustedY,
              width: adjustedWidth,
              height: adjustedHeight,
              color: rgb(0, 0, 1),
            });
            break;
          case "line":
            page.drawLine({
              start: { x: adjustedX, y: adjustedY },
              end: {
                x: adjustedX + adjustedWidth,
                y: adjustedY - adjustedHeight,
              },
              color: rgb(0, 1, 0),
              thickness: 2,
            });
            break;
          default:
            break;
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pdf-with-drawings.pdf";
      a.click();
    }
  };

  //  work old
  //   const handleSavePDF = async () => {
  //     if (pdfFile) {
  //       const existingPdfBytes = await fetch(pdfFile).then((res) =>
  //         res.arrayBuffer()
  //       );
  //       const pdfDoc = await PDFDocument.load(existingPdfBytes);
  //       const page = pdfDoc.getPages()[0];
  //       const { width, height } = page.getSize(); // Get actual page dimensions

  //       shapes.forEach((shape) => {
  //         const adjustedX = shape.x * zoom;
  //         const adjustedY = height - (shape.y * zoom + shape.height * zoom); // Adjust Y-coordinate for PDF coordinate system
  //         const adjustedWidth = shape.width * zoom;
  //         const adjustedHeight = shape.height * zoom;

  //         switch (shape.tool) {
  //           case "circle":
  //             page.drawEllipse({
  //               x: adjustedX + adjustedWidth / 2,
  //               y: adjustedY + adjustedHeight / 2,
  //               radiusX: Math.max(adjustedWidth, adjustedHeight) / 2,
  //               radiusY: Math.max(adjustedWidth, adjustedHeight) / 2,
  //               color: rgb(1, 0, 0),
  //             });
  //             break;
  //           case "rectangle":
  //             page.drawRectangle({
  //               x: adjustedX,
  //               y: adjustedY,
  //               width: adjustedWidth,
  //               height: adjustedHeight,
  //               color: rgb(0, 0, 1),
  //             });
  //             break;
  //           case "line":
  //             page.drawLine({
  //               start: { x: adjustedX, y: adjustedY },
  //               end: {
  //                 x: adjustedX + adjustedWidth,
  //                 y: adjustedY - adjustedHeight,
  //               },
  //               color: rgb(0, 1, 0),
  //               thickness: 2,
  //             });
  //             break;
  //           default:
  //             break;
  //         }
  //       });

  //       const pdfBytes = await pdfDoc.save();
  //       const blob = new Blob([pdfBytes], { type: "application/pdf" });
  //       const url = URL.createObjectURL(blob);
  //       const a = document.createElement("a");
  //       a.href = url;
  //       a.download = "pdf-with-drawings.pdf";
  //       a.click();
  //     }
  //   };

  //   const handleSavePDF = async () => {
  //     if (pdfFile) {
  //       const existingPdfBytes = await fetch(pdfFile).then((res) =>
  //         res.arrayBuffer()
  //       );
  //       const pdfDoc = await PDFDocument.load(existingPdfBytes);
  //       const page = pdfDoc.getPages()[0];

  //       // Clear existing drawings
  //       page.drawRectangle({
  //         x: 0,
  //         y: 0,
  //         width: pdfDimensions.width,
  //         height: pdfDimensions.height,
  //         color: rgb(1, 1, 1),
  //       });

  //       shapes.forEach((shape) => {
  //         const adjustedX = shape.x * zoom;
  //         const adjustedY =
  //           pdfDimensions.height - (shape.y * zoom + shape.height * zoom); // Adjust Y-coordinate for PDF coordinate system
  //         const adjustedWidth = shape.width * zoom;
  //         const adjustedHeight = shape.height * zoom;

  //         switch (shape.tool) {
  //           case "circle":
  //             page.drawEllipse({
  //               x: adjustedX + adjustedWidth / 2,
  //               y: adjustedY + adjustedHeight / 2,
  //               radiusX: Math.max(adjustedWidth, adjustedHeight) / 2,
  //               radiusY: Math.max(adjustedWidth, adjustedHeight) / 2,
  //               color: rgb(1, 0, 0),
  //             });
  //             break;
  //           case "rectangle":
  //             page.drawRectangle({
  //               x: adjustedX,
  //               y: adjustedY,
  //               width: adjustedWidth,
  //               height: adjustedHeight,
  //               color: rgb(0, 0, 1),
  //             });
  //             break;
  //           case "line":
  //             page.drawLine({
  //               start: { x: adjustedX, y: adjustedY },
  //               end: {
  //                 x: adjustedX + adjustedWidth,
  //                 y: adjustedY - adjustedHeight,
  //               },
  //               color: rgb(0, 1, 0),
  //               thickness: 2,
  //             });
  //             break;
  //           default:
  //             break;
  //         }
  //       });

  //       const pdfBytes = await pdfDoc.save();
  //       const blob = new Blob([pdfBytes], { type: "application/pdf" });
  //       const url = URL.createObjectURL(blob);
  //       const a = document.createElement("a");
  //       a.href = url;
  //       a.download = "pdf-with-drawings.pdf";
  //       a.click();
  //     }
  //   };
  //   const handleSavePDF = async () => {
  //     if (pdfFile) {
  //       const existingPdfBytes = await fetch(pdfFile).then((res) =>
  //         res.arrayBuffer()
  //       );
  //       const pdfDoc = await PDFDocument.load(existingPdfBytes);
  //       const page = pdfDoc.getPages()[0];

  //       // Clear existing drawings
  //       page.drawRectangle({
  //         x: 0,
  //         y: 0,
  //         width: pdfDimensions.width,
  //         height: pdfDimensions.height,
  //         color: rgb(1, 1, 1),
  //       });

  //       shapes.forEach((shape) => {
  //         const adjustedX = shape.x * zoom;
  //         const adjustedY =
  //           pdfDimensions.height - (shape.y * zoom + shape.height * zoom); // Adjust Y-coordinate for PDF coordinate system
  //         const adjustedWidth = shape.width * zoom;
  //         const adjustedHeight = shape.height * zoom;

  //         switch (shape.tool) {
  //           case "circle":
  //             page.drawEllipse({
  //               x: adjustedX + adjustedWidth / 2,
  //               y: adjustedY + adjustedHeight / 2,
  //               radiusX: Math.max(adjustedWidth, adjustedHeight) / 2,
  //               radiusY: Math.max(adjustedWidth, adjustedHeight) / 2,
  //               color: rgb(1, 0, 0),
  //             });
  //             break;
  //           case "rectangle":
  //             page.drawRectangle({
  //               x: adjustedX,
  //               y: adjustedY,
  //               width: adjustedWidth,
  //               height: adjustedHeight,
  //               color: rgb(0, 0, 1),
  //             });
  //             break;
  //           case "line":
  //             page.drawLine({
  //               start: { x: adjustedX, y: adjustedY },
  //               end: {
  //                 x: adjustedX + adjustedWidth,
  //                 y: adjustedY - adjustedHeight,
  //               },
  //               color: rgb(0, 1, 0),
  //               thickness: 2,
  //             });
  //             break;
  //           default:
  //             break;
  //         }
  //       });

  //       const pdfBytes = await pdfDoc.save();
  //       const blob = new Blob([pdfBytes], { type: "application/pdf" });
  //       const url = URL.createObjectURL(blob);
  //       const a = document.createElement("a");
  //       a.href = url;
  //       a.download = "pdf-with-drawings.pdf";
  //       a.click();
  //     }
  //   };

  const renderShapes = () => {
    return shapes.map((shape, index) => {
      const scaleX = zoom;
      const scaleY = zoom;
      const adjustedY = pdfDimensions.height - shape.y * scaleY; // Invert Y-axis
      switch (shape.tool) {
        case "circle":
          return (
            <Circle
              key={index}
              x={shape.x * scaleX}
              y={adjustedY}
              radius={Math.max(shape.width * scaleX, shape.height * scaleY) / 2}
              fill="red"
              draggable
            />
          );
        case "rectangle":
          return (
            <Rect
              key={index}
              x={shape.x * scaleX}
              y={adjustedY}
              width={shape.width * scaleX}
              height={shape.height * scaleY}
              fill="blue"
              draggable
            />
          );
        case "line":
          return (
            <Line
              key={index}
              points={[
                shape.x * scaleX,
                adjustedY,
                shape.x * scaleX + shape.width * scaleX,
                adjustedY - shape.height * scaleY,
              ]}
              stroke="green"
              strokeWidth={2}
              draggable
            />
          );
        default:
          return null;
      }
    });
  };

  const newPlugin = defaultLayoutPlugin();

  useEffect(() => {
    const handleResize = () => {
      if (stageRef.current) {
        const { width, height } = stageRef.current.getClientRect();
        setPdfPageDimensions({ width, height });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <input type="file" className="form-control" onChange={handleChange} />
        <button type="submit" className="btn btn-success">
          View Pdf
        </button>
      </form>
      <div className="tool-selection">
        <button onClick={() => handleToolChange("circle")}>Circle</button>
        <button onClick={() => handleToolChange("rectangle")}>Rectangle</button>
        <button onClick={() => handleToolChange("line")}>Line</button>
        <button onClick={handleSavePDF}>Save PDF with Drawings</button>
      </div>
      <h2>View PDF</h2>
      <div className="pdf-container" style={{ position: "relative" }}>
        <Worker
          workerUrl={`https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.js`}
        >
          {viewPdf && (
            <>
              <Viewer
                fileUrl={viewPdf}
                plugins={[newPlugin]}
                defaultScale={1.0}
                onZoomChange={handleZoomChange}
                onRenderSuccess={handleRenderSuccess}
              />
              <Stage
                ref={stageRef}
                width={pdfDimensions.width}
                height={pdfDimensions.height}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                style={{ position: "absolute", top: 0, left: 0 }}
              >
                <Layer>{renderShapes()}</Layer>
              </Stage>
            </>
          )}
          {!viewPdf && <>No PDF</>}
        </Worker>
      </div>
    </div>
  );
}
