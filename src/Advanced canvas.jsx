import { useRef, useState, useEffect } from "react";
import IconButton from "@mui/material/IconButton";
import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import EditIcon from "@mui/icons-material/Edit";       
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import CropSquareIcon from "@mui/icons-material/CropSquare"; 
import CircleIcon from "@mui/icons-material/Circle";
import UndoIcon from "@mui/icons-material/Undo";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import { FaEraser } from "react-icons/fa";


function AdvancedCanvas() {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);
  const [shapes, setShapes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState(null);
  const [selectedTextIndex, setSelectedTextIndex] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = 1400;
    const cssHeight = 800;
    
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.width = cssWidth + "px";
    canvas.style.height = cssHeight + "px";
    ctx.scale(dpr, dpr);
    drawShapes(shapes, selectedTextIndex);
  }, []);



  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
  
    if (tool === "text-select") {
      let found = -1;
      shapes.forEach((s, i) => {
        if (s.tool === "text") {
          const width = s.text.length * (s.lineWidth * 3);
          const height = s.lineWidth * 6;
          if (x >= s.startX && x <= s.startX + width && y <= s.startY && y >= s.startY - height) {
            found = i;
          }
        }
      });
      setSelectedTextIndex(found);
      drawShapes(shapes, found);
      return;
    }

    if (tool === "pan" || tool === "lock") 
      return;
    const startX = x;
    const startY = y;
      if (tool === "text") {
        const text = prompt("Enter text:");
      if (text) {
        const shape = { tool, startX, startY, text, color, lineWidth };
        setShapes([...shapes, shape]);
      }
      return;
    }

    if (tool === "pencil" || tool === "eraser") {
      setCurrentShape({
        tool,
        color: tool === "eraser" ? "#ffffff" : color,
        lineWidth,
        points: [{ x: startX, y: startY }],
      });
    } else {
      setCurrentShape({
        tool,
        startX,
        startY,
        endX: startX,
        endY: startY,
        color,
        lineWidth,
      });
    }
    setIsDrawing(true);
  };

 
  const handleMouseMove = (e) => {
    if (!isDrawing || tool === "text") 
        return;
    const rect = canvasRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    if (tool === "pencil" || tool === "eraser") {
      setCurrentShape((prev) => ({ ...prev,
        points: [...prev.points, { x: offsetX, y: offsetY }],
      }));
      drawShapes( [...shapes, { ...currentShape, 
        points: [...currentShape?.points || [], { x: offsetX, y: offsetY }] }],
        selectedTextIndex
      );
    } else {
      setCurrentShape((prev) => ({ ...prev, endX: offsetX, endY: offsetY }));
      drawShapes(
        [...shapes, { ...currentShape, endX: offsetX, endY: offsetY }],
        selectedTextIndex
      );
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setShapes([...shapes, currentShape]);
    setCurrentShape(null);
    setIsDrawing(false);
  };
 
  const drawShapes = (allShapes, highlightIndex = null) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    allShapes.forEach((s, i) => {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.lineWidth;
      ctx.fillStyle = s.color;

      switch (s.tool) {
        case "pencil":
        case "eraser":
          ctx.beginPath();
          s.points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();
          break;

        case "line":
          ctx.beginPath();
          ctx.moveTo(s.startX, s.startY);
          ctx.lineTo(s.endX, s.endY);
          ctx.stroke();
          break;

        case "rect":
          ctx.strokeRect(s.startX, s.startY, s.endX - s.startX, s.endY - s.startY);
          break;

        case "ellipse":
          ctx.beginPath();
          ctx.ellipse((s.startX + s.endX) / 2, (s.startY + s.endY) / 2, Math.abs(s.endX - s.startX) / 2, Math.abs(s.endY - s.startY) / 2, 0, 0, 2 * Math.PI );
          ctx.stroke();
          break;

        case "text":
          ctx.font = `${s.lineWidth * 5}px Arial`;
          ctx.fillText(s.text, s.startX, s.startY);
          
          if (highlightIndex === i) {
            const width = s.text.length * (s.lineWidth * 3);
            const height = s.lineWidth * 6;
            ctx.strokeStyle = "red";
            ctx.lineWidth = 1;
            ctx.strokeRect(s.startX - 2, s.startY - height, width + 4, height + 4);
          }
          break;

        default:
          break;
      }
    });
  };

    useEffect(() => {
      drawShapes(shapes, selectedTextIndex);
    }, [shapes, selectedTextIndex]);
  
    const handleUndo = () => {
      const newShapes = shapes.slice(0, -1);
      setShapes(newShapes);
    };
  
    useEffect(() => {
      const handleKey = (e) => {
        if (selectedTextIndex === null) 
          return;
        
        if (e.key === "Delete" || e.key === "Backspace") {
          const updated = shapes.filter((_, i) => i !== selectedTextIndex);
          setShapes(updated);
          setSelectedTextIndex(null);
        }
      
        if (e.key.toLowerCase() === "e") {
          const newText = prompt("Edit text:", shapes[selectedTextIndex].text);
          if (newText !== null) {
            const updated = [...shapes];
            updated[selectedTextIndex].text = newText;
            setShapes(updated);
          }
        }
      };
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }, [selectedTextIndex, shapes]);

  return (
    <div className="full-container">
      <div style={{ textAlign: "center"}}>
        <h2>Advanced Canvas</h2>
        <div className="tools" style={{ marginBottom: "40px", marginTop: "20px",display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", alignItems: "center" }}>
           <IconButton onClick={() => setTool("pencil")} title="Pencil">
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => setTool("eraser")} title="Eraser">
              <FaEraser  />
            </IconButton>
            <IconButton onClick={() => setTool("line")} title="Line">
              <HorizontalRuleIcon />
            </IconButton>
            <IconButton onClick={() => setTool("rect")} title="Rectangle">
              <CropSquareIcon />
            </IconButton>
            <IconButton onClick={() => setTool("ellipse")} title="Ellipse">
              <CircleIcon />
            </IconButton>
            <IconButton onClick={() => setTool("text")} title="Text">
              <TextFieldsIcon />
            </IconButton>
            <IconButton onClick={() => setTool("text-select")} title="Select Text">
              <FormatColorFillIcon />
            </IconButton>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} title="Color" style={{ width: 40, height: 40, border: "none", padding: 0 }} />
            <input type="number" min="1" max="20" value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} title="Line Width" style={{ width: 60 }} />
            <IconButton onClick={() => setShapes([])} title="Clear All">
              <ClearAllIcon />
            </IconButton>
            <IconButton onClick={handleUndo} title="Undo">
              <UndoIcon />
            </IconButton>
        </div>

        <canvas
          ref={canvasRef}
          style={{ width: "1400px", height:"550px" , border: "2px solid black", borderRadius: "8px", cursor: tool === "text-select" ? "pointer" : "crosshair", }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp} />
      </div>
    </div>
  );
}

export default AdvancedCanvas;


