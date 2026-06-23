import { useState } from "react";
import { PageShell, Panel } from "@ai-otter/ui";
import { deviceSimulator } from "../services/deviceSimulator";

export function MePage() {
  const device = deviceSimulator.getState();
  const [gpsEnabled, setGpsEnabled] = useState(false);

  return (
    <PageShell title="我的">
      <div className="space-y-4">
        <Panel>
          <p className="text-lg font-bold text-slate-900">nearu Demo</p>
          <p className="mt-2 text-slate-600">当前是 Hackathon 公开 Web/PWA Demo，使用 mock AI 和设备模拟器。</p>
        </Panel>
        <Panel>
          <p className="text-lg font-bold text-slate-900">桌宠模拟器</p>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500 mb-1">连接</dt>
              <dd className="font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded inline-block">{device.connection}</dd>
            </div>
            <div>
              <dt className="text-slate-500 mb-1">电量</dt>
              <dd className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-block">{device.batteryLevel}%</dd>
            </div>
            <div>
              <dt className="text-slate-500 mb-1">屏幕</dt>
              <dd className="font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block">{device.screenState}</dd>
            </div>
            <div>
              <dt className="text-slate-500 mb-1">灯效</dt>
              <dd className="font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block">{device.lightMode}</dd>
            </div>
          </dl>
        </Panel>
        <Panel>
          <p className="text-lg font-bold text-slate-900">隐私设置</p>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="font-semibold text-slate-800">位置分享 (紧急情况)</p>
                <p className="text-xs text-slate-500 mt-1">仅在长按求助键时分享给紧急联系人</p>
              </div>
              <button 
                className={`w-12 h-6 rounded-full transition-colors relative ${gpsEnabled ? 'bg-teal-600' : 'bg-slate-300'}`}
                onClick={() => setGpsEnabled(!gpsEnabled)}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${gpsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Demo 数据声明</p>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">此演示版本不收集您的真实健康数据、联系人或定位信息。所有记录均保存在本地浏览器中。</p>
            </div>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
