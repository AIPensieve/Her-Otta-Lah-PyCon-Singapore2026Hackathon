import { PageShell, Panel } from "@ai-otter/ui";
import { deviceSimulator } from "../services/deviceSimulator";

export function MePage() {
  const device = deviceSimulator.getState();

  return (
    <PageShell title="我的">
      <div className="space-y-3">
        <Panel>
          <p className="text-lg font-bold">nearu Demo</p>
          <p className="mt-2 text-slate-600">当前是 Hackathon 公开 Web/PWA Demo，使用 mock AI 和设备模拟器。</p>
        </Panel>
        <Panel>
          <p className="text-lg font-bold">桌宠模拟器</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <dt className="text-slate-500">连接</dt>
            <dd className="font-semibold">{device.connection}</dd>
            <dt className="text-slate-500">电量</dt>
            <dd className="font-semibold">{device.batteryLevel}%</dd>
            <dt className="text-slate-500">屏幕</dt>
            <dd className="font-semibold">{device.screenState}</dd>
            <dt className="text-slate-500">灯效</dt>
            <dd className="font-semibold">{device.lightMode}</dd>
          </dl>
        </Panel>
        <Panel>
          <p className="text-lg font-bold">隐私边界</p>
          <p className="mt-2 text-slate-600">Demo 不收集真实联系人、真实定位、API key 或敏感健康数据。</p>
        </Panel>
      </div>
    </PageShell>
  );
}
