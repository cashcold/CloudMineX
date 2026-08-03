import React, { Component } from 'react';
import QRCode from 'qrcode';

export class QRCodeDisplay extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    this.generateQR();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value) {
      this.generateQR();
    }
  }

  generateQR() {
    const { value, size = 160 } = this.props;
    if (this.canvasRef.current && value) {
      QRCode.toCanvas(
        this.canvasRef.current,
        value,
        {
          width: size,
          margin: 2,
          color: {
            dark: '#07111F',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) console.error('Error generating QR Code:', error);
        }
      );
    }
  }

  render() {
    const { value } = this.props;
    return (
      <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-lg border border-slate-200">
        {value ? (
          <canvas ref={this.canvasRef} className="rounded-lg" />
        ) : (
          <div className="w-32 h-32 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">
            No QR Data
          </div>
        )}
      </div>
    );
  }
}

export default QRCodeDisplay;
