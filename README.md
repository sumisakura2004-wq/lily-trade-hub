# 婵乡源 B2B 数字展厅

面向采购商的中英双语产品展厅，提供产品详情、规格包装、起订量和供应商联系方式。所有产品统一采用询价方式，不公开价格。网站不会自动发送询盘或创建订单。

技术栈：Next.js App Router、TypeScript、Tailwind CSS、Sanity CMS。

## 本地运行

需要 Node.js >= 22.12 和 npm。

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Windows PowerShell 可使用 `Copy-Item .env.example .env.local` 和 `npm.cmd`。打开本地开发服务器提供的地址，访问 `/zh` 或 `/en`；产品详情支持语言切换，询价按钮指向供应商联系区域。

## 环境变量

| 名称 | 用途 |
| --- | --- |
| NEXT_PUBLIC_SANITY_PROJECT_ID | Sanity 项目标识，公开配置 |
| NEXT_PUBLIC_SANITY_DATASET | Sanity 数据集名称，公开配置 |
| SANITY_API_READ_TOKEN | 私有数据集的服务端只读 Token，不得放入浏览器变量 |
| COMPANY_VERIFIED_WHATSAPP_URL | 可选，经供应商核验的 WhatsApp 直达地址 |

示例文件仅包含空值。使用自己的 Sanity 项目并配置产品 Schema；`/studio` 使用 Sanity 管理员账户登录。公开页面仅读取已发布且允许展示的产品；缺少配置或读取失败时显示暂不可用，不回退到静态种子数据。

## 检查与生产运行

```sh
npm run check:cms
npm run lint
npm run typecheck
npm run build
npm start
```

CMS 离线检查使用合成数据，不连接云端。请勿将凭据、内部商业资料或运维记录提交到源码仓库。仓库不提供内部导入与运维工具；相关本地 npm 操作不属于公开使用接口。

## 素材使用

产品名称、品牌及图片的使用需取得相应权利人的许可；仓库可见性不构成素材授权。首次公开前仍须完成产品图片的细字、元数据和使用权验收。
