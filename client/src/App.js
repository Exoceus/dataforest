
import React, { useState, useEffect, useRef } from "react"
import { CSVLink, CSVDownload } from "react-csv";

import "./App.css"

const App = () => {

  const canvas = useRef(null)
  const ctxRef = useRef(null)

  const [scaleRatio, setScaleRatio] = useState(1)

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

      ctxRef.current.font = `${16 * scaleRatio}px Arial`;
      ctxRef.current.fillText(boxes.label, boxes.x + (3 * scaleRatio), boxes.y + (15 * scaleRatio));
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
      const ctx = canvas.current.getContext("2d");

      canvas.current.style.width = `100%`;
      canvas.current.style.height = `100%`;

      setScaleRatio(image.naturalWidth / canvas.current.offsetWidth)

      ctx.canvas.height = image.naturalHeight * (1 / (image.naturalWidth / canvas.current.offsetWidth));
      ctx.canvas.width = image.naturalWidth * (1 / (image.naturalWidth / canvas.current.offsetWidth));


      ctx.scale((1 / (image.naturalWidth / canvas.current.offsetWidth)), (1 / (image.naturalWidth / canvas.current.offsetWidth)));
      ctx.lineWidth = Math.floor(3 * image.naturalWidth / canvas.current.offsetWidth);


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
    if (image && currentLabel != "") {
      const { offsetX, offsetY } = nativeEvent;
      //ctxRef.current.moveTo(offsetX, offsetY);
      ctxRef.current.beginPath()
      setBoxOriginX(offsetX)
      setBoxOriginY(offsetY)
      setIsDrawing(true);
    }
  };

  const finishDrawing = ({ nativeEvent }) => {
    if (image && currentLabel != "") {
      const { offsetX, offsetY } = nativeEvent;
      ctxRef.current.closePath();

      ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
      ctxRef.current.drawImage(image, 0, 0)

      displayBoxes()

      ctxRef.current.strokeRect(Math.floor(boxOriginX * scaleRatio), boxOriginY * scaleRatio, Math.floor((offsetX - boxOriginX) * scaleRatio), Math.floor((offsetY - boxOriginY) * scaleRatio));

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


        const newboxesHistory = [...boxesHistory, { label: currentLabel.text, x: Math.floor(x * scaleRatio), y: Math.floor(y * scaleRatio), width: Math.floor(width * scaleRatio), height: Math.floor(height * scaleRatio), color: currentLabel.color }];

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

    else if (image && currentLabel != "") {
      ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
      ctxRef.current.drawImage(image, 0, 0)

      displayBoxes();

      ctxRef.current.setLineDash([Math.floor(4 * image.naturalWidth / canvas.current.offsetWidth)]);


      ctxRef.current.strokeStyle = "#" + currentLabel.color;


      ctxRef.current.strokeRect(Math.floor(boxOriginX * scaleRatio), boxOriginY * scaleRatio, Math.floor((offsetX - boxOriginX) * scaleRatio), Math.floor((offsetY - boxOriginY) * scaleRatio));



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

  if (image && canvas) {
    var image_specs = <span>Image Width: {image.naturalWidth}, Height:  {image.naturalHeight}</span>

    var labels_input =
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
    var labels_heading = <h4 className="small-title">Labels</h4>
    var label_selection = <div className="label-options-wrapper">

      {labels.map((item, index) => {
        return (
          <div>
            <input type="radio" value={item.text} onChange={e => setCurrentLabel({ text: e.target.value, color: getCurrentLabelColor(e.target.value) })} checked={currentLabel.text == item.text} /> {item.text}
          </div>)
      }
      )}
    </div>
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



  console.log(scaleRatio);
  console.log(boxesHistory);

  if (image) {
    var canvas_styling = { display: 'block' }
  }

  else {
    var canvas_styling = { display: 'none' }
  }

  return (
    <div className="labelling-wrapper">
      <div>
        <h1>Dataforest</h1>
        {image_specs}

        <div>
          <input type="text"
            className="image-url-input"
            placeholder="Enter image URL"
            value={imageURL}
            onChange={e => setURL(e.target.value)}
          />

        </div>

        {labels_input}
        {labels_heading}
        {label_selection}

        <div>
          <canvas
            style={canvas_styling}
            ref={canvas}
            onMouseDown={startDrawing}
            onMouseUp={finishDrawing}
            onMouseMove={draw}
            className="labelling-canvas"
          />
        </div>
      </div>
      <div>
        {boxes_list}
      </div>



    </div>
  )
}

export default App