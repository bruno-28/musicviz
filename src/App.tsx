import React, { Component, createRef } from "react";
import "./App.css";
import songFile from "./assets/forever.mp3";
import { Button, Col, Container, Navbar, Row } from "react-bootstrap";
import logo from "./assets/react.svg";

// constants
const width = 800;
const height = 400;

type MyProps = {
  audio: HTMLAudioElement;
};

type MyState = {
  buttonText: string;
};

class App extends React.Component<MyProps, MyState> {
  audioContext: AudioContext;
  analyser: AnalyserNode;
  source: MediaElementAudioSourceNode;
  bufferLength: number;
  frequency_array: Uint8Array;
  rafId: number;
  canvas: RefObject<HTMLCanvasElement>; //TODO
  canvasContext: CanvasRenderingContext2D;
  audio: HTMLAudioElement;

  constructor(props: MyProps) {
    super(props);
    this.audio = new Audio(songFile);
    this.canvas = createRef<HTMLCanvasElement>();
    this.state = {
      buttonText: "Play",
    };
  }

  componentDidMount() {
    // this.audioContext = new (window.AudioContext || window.webkitAudioContext)(); // for legacy purposes (old browser versions)
    this.audioContext = new window.AudioContext();
    this.source = this.audioContext.createMediaElementSource(this.audio);
    this.analyser = this.audioContext.createAnalyser();
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    // this.analyser.fftSize = 512;
    this.analyser.minDecibels = -80;
    this.analyser.maxDecibels = -20;
    this.analyser.smoothingTimeConstant = 0.85;

    this.bufferLength = this.analyser.frequencyBinCount;
    this.frequency_array = new Uint8Array(this.bufferLength);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.rafId);
    this.analyser.disconnect();
    this.source.disconnect();
  }

  togglePlayPause = () => {
    const { audio } = this;
    if (audio.paused) {
      audio.play();
      this.rafId = requestAnimationFrame(this.tick);
      this.setState({ buttonText: "Pause" });
    } else {
      audio.pause();
      cancelAnimationFrame(this.rafId);
      this.setState({ buttonText: "Play" });
    }
  };

  tick = () => {
    this.animation(this.canvas.current);
    this.analyser.getByteFrequencyData(this.frequency_array);
    // this.analyser.getByteTimeDomainData(this.frequency_array);
    this.rafId = requestAnimationFrame(this.tick);
  };

  animation(canvas: HTMLCanvasElement) {
    canvas.width = width;
    canvas.height = height;

    this.canvasContext = this.canvas.current?.getContext("2d");
    this.draw(this.canvasContext);
  }

  draw(canvasContext: CanvasRenderingContext2D) {
    canvasContext.fillStyle = "rgb(40, 44, 52)";
    canvasContext.fillRect(0, 0, width, height);

    const barWidth = width / this.bufferLength;
    let barHeight;
    let x = 0;

    for (let i = 0; i < this.bufferLength; i++) {
      barHeight = this.frequency_array[i] * 2.0;
      canvasContext.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
      canvasContext.fillRect(x, height - barHeight / 2, barWidth, barHeight);
      x += barWidth + 1;
    }
  }

  render() {
    const { buttonText } = this.state;
    return (
      <div className="App">
        <Navbar bg="dark" variant="dark">
          <Container>
            <Navbar.Brand>
              <img
                alt=""
                src={logo}
                width="30"
                height="30"
                className="d-inline-block align-top"
              />{" "}
              Audio Visualization
            </Navbar.Brand>
          </Container>
        </Navbar>
        <Container>
          <Row>
            <canvas ref={this.canvas} />
          </Row>
          <Row className="mt-5">
            <Col>
              <Button variant="dark" onClick={this.togglePlayPause}>
                {buttonText}
              </Button>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default App;
