import React, { Component } from 'react';

export class DemoModeBadge extends Component {
  render() {
    return (
      <div id="cloud-node-badge" className="bg-[#00D4A8]/10 text-[#00D4A8] px-3 py-1 rounded-full text-[10px] font-bold border border-[#00D4A8]/30 flex items-center gap-2 uppercase tracking-wider shadow-sm">
        <span className="w-2 h-2 bg-[#00D4A8] rounded-full animate-pulse"></span>
        <span>Live Cloud Rig Active.</span>
      </div>
    );
  }
}

export default DemoModeBadge;


