
import React, { useState, useEffect, useRef } from "react"
import { CSVLink, CSVDownload } from "react-csv";

import "./App.css"

const App = () => {

  const canvas = useRef(null)
  const ctxRef = useRef(null)

  const [image, setImage] = useState(null)
  const [imageURL, setURL] = useState('')

  const [isDrawing, setIsDrawing] = useState(false)
  const [boxOriginX, setBoxOriginX] = useState(0)
  const [boxOriginY, setBoxOriginY] = useState(0)

  const [labels, setLabels] = useState([])
  var [newlabel, setNewLabel] = useState("");
  const [currentLabel, setCurrentLabel] = useState("")

  const [boxesHistory, setBoxesHistory] = useState([])

  const preset_colors = ["0022ff", "9500ff", "ff00bf", "ff0000", "ff6a00", "fff700", "91ff00", "00ff04", "00ffc8", "00ffc8"]

  const [download_data, setDownloadData] = useState([["label", "x", "y", "width", "height"]])

  const displayBoxes = () => {
    boxesHistory.forEach(boxes => {

      ctxRef.current.strokeStyle = "#" + boxes.color;
      ctxRef.current.fillStyle = "#" + boxes.color;

      ctxRef.current.strokeRect(boxes.x, boxes.y, boxes.width, boxes.height);

      ctxRef.current.font = "14px Arial";
      ctxRef.current.fillText(boxes.label, boxes.x + 4, boxes.y + 18);
    });
  }

  const getCurrentLabelColor = (label) => {
    for (var i = 0; i < labels.length; i++) {
      if (label == labels[i].text) {
        return labels[i].color
      }
    }

  }

  useEffect(() => {
    const rawImage = new Image();
    rawImage.src = imageURL
    rawImage.onload = () => setImage(rawImage)

  }, [imageURL])

  useEffect(() => {
    if (image && canvas) {
      const ctx = canvas.current.getContext("2d")
      ctx.canvas.height = image.naturalHeight * 2
      ctx.canvas.width = image.naturalWidth * 2

      canvas.current.style.width = `${image.naturalWidth}px`;
      canvas.current.style.height = `${image.naturalHeight}px`;


      ctx.scale(2, 2);
      ctx.lineWidth = 2;

      ctx.drawImage(image, 0, 0)

      ctxRef.current = canvas.current.getContext("2d")
    }
  }, [image])



  if (image && ctxRef.current) {
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    ctxRef.current.drawImage(image, 0, 0)

    displayBoxes();
  }

  const startDrawing = ({ nativeEvent }) => {
    if (image) {
      const { offsetX, offsetY } = nativeEvent;
      //ctxRef.current.moveTo(offsetX, offsetY);
      ctxRef.current.beginPath()
      setBoxOriginX(offsetX)
      setBoxOriginY(offsetY)
      setIsDrawing(true);
    }
  };

  const finishDrawing = ({ nativeEvent }) => {
    if (image) {
      const { offsetX, offsetY } = nativeEvent;
      ctxRef.current.closePath();

      ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
      ctxRef.current.drawImage(image, 0, 0)

      displayBoxes()

      ctxRef.current.strokeRect(boxOriginX, boxOriginY, offsetX - boxOriginX, offsetY - boxOriginY);

      if (Math.abs(offsetX - boxOriginX) > 5 && Math.abs(offsetY - boxOriginY) > 5) {

        var x, y, width, height;

        if (offsetX - boxOriginX < 0) {
          x = offsetX;
          width = boxOriginX - offsetX;
        }

        else {
          x = boxOriginX;
          width = offsetX - boxOriginX;
        }

        if (offsetY - boxOriginY < 0) {
          y = offsetY;
          height = boxOriginY - offsetY;
        }

        else {
          y = boxOriginY;
          height = offsetY - boxOriginY;
        }


        const newboxesHistory = [...boxesHistory, { label: currentLabel.text, x: x, y: y, width: width, height: height, color: currentLabel.color }];

        setBoxesHistory(newboxesHistory)

        const newDownload = [...download_data, [currentLabel.text, x, y, width, height]];
        setDownloadData(newDownload)
      }


      setIsDrawing(false);
    }
  };

  const draw = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;

    if (!isDrawing) {
      return;
    }

    if (ctxRef.current.isPointInPath(offsetX, offsetY)) {
      console.log('Tee')
    }

    else if (image) {
      ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
      ctxRef.current.drawImage(image, 0, 0)

      displayBoxes();

      ctxRef.current.setLineDash([3]);


      ctxRef.current.strokeStyle = "#" + currentLabel.color;


      ctxRef.current.strokeRect(boxOriginX, boxOriginY, offsetX - boxOriginX, offsetY - boxOriginY);

      ctxRef.current.setLineDash([0]);

    }
  };


  const remove = (index) => {
    console.log("it works")
    const newBoxes = [...boxesHistory];
    newBoxes.splice(index, 1);

    setBoxesHistory(newBoxes);

    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    ctxRef.current.drawImage(image, 0, 0)

    displayBoxes();
  }

  const addLabel = text => {
    const NewLabels = [...labels, { text: text, color: preset_colors[Math.floor(Math.random() * (10 + 1))] }];
    setLabels(NewLabels);
  };

  const handleLabelSubmit = e => {
    e.preventDefault();
    if (!newlabel) return;
    newlabel = newlabel.toLowerCase().trim().replace(/ /g, "_");

    addLabel(newlabel);
    setNewLabel("");
  };

  if (image) {
    var image_specs = <span>Image Width: {image.naturalWidth}, Height:  {image.naturalHeight}</span>

    var labels_heading = <h4>Labels</h4>
    var label_selection = <>

      {labels.map((item, index) => {
        return (
          <div>
            <input type="radio" value={item.text} onChange={e => setCurrentLabel({ text: e.target.value, color: getCurrentLabelColor(e.target.value) })} checked={currentLabel.text == item.text} /> {item.text}</div>)
      }
      )}
    </>
  }

  if (boxesHistory.length > 0) {

    var boxes_list = <div className="label-group-wrapper">
      <h4>Bounding Boxes</h4>

      <div className="bounding-box-list-wrapper">
        {boxesHistory.map((item, index) =>
          <div className="bounding-box-list-item">Label: {item.label}, X: {item.x}, Y: {item.y}, Width: {item.width}, Height: {item.height} <button className="bounding-box-list-del" onClick={() => remove(index)}>Delete</button></div>
        )}
      </div>

      <CSVLink data={download_data} className="download-data-button">Export CSV</CSVLink>
    </div>
  }

  console.log(download_data);
  console.log(boxesHistory);

  return (
    <div>
      <h1>Please provide an image and label it</h1>
      {image_specs}
      <br />
      <div>
        <input type="text"
          className="image-url-input"
          value={imageURL}
          onChange={e => setURL(e.target.value)}
        />

      </div>
      <br />
      <form onSubmit={handleLabelSubmit}>
        <input
          type="text"
          className="input"
          value={newlabel}
          onChange={e => setNewLabel(e.target.value)}
          placeholder="Enter new label"
          required
        />
        <button type="submit">Add Label</button>
      </form>
      {labels_heading}
      {label_selection}
      <br />
      <br />
      <div>
        <canvas
          ref={canvas}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          className="labelling-canvas"
        />
      </div>

      {boxes_list}

    </div>
  )
}

export default App