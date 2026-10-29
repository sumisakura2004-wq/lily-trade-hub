import { getStudioEnvironment } from "@/sanity/studio-config";
import { ProductStudio } from "./studio";

export const dynamic = "force-static";
export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  if (!getStudioEnvironment()) {
    return (
      <main style={{ maxWidth: 720, margin: "64px auto", padding: 24, fontFamily: "system-ui, sans-serif", lineHeight: 1.7 }}>
        <h1>管理员后台尚未配置</h1>
        <p>本地后台代码已准备。请先由项目负责人创建并确认 Sanity Growth 私有数据集，再设置项目 ID、数据集名称及允许的 Studio 访问来源。</p>
        <p>当前未连接 CMS，也未加载任何商品或报价。网站服务器只读令牌不在此页面填写。</p>
        <h2>Studio is not configured</h2>
        <p>The local integration is ready. The project owner must configure a Sanity Growth private dataset, public project identifiers and allowed Studio origins before administrator sign-in.</p>
        <p>No CMS connection or product data has been loaded. Never enter the server read token on this page.</p>
      </main>
    );
  }
  return <ProductStudio />;
}
