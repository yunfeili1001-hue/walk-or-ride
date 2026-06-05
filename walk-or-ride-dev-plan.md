# Walk or Ride? — Cursor 开发计划

## 项目概述

用户输入起点和终点，App 同时查询：
- 步行时间（Google Maps Distance Matrix API）
- 实时公交到达（OneBusAway API）
- 当前天气（OpenWeatherMap API）

综合以上数据，给出一句话推荐：走路还是坐公交。

用户可注册登录，保存常用路线（Firebase），一键获取结果。

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React (Vite) |
| UI 组件 | React-Bootstrap |
| 路由 | React Router v6 |
| 后端/数据库 | Firebase (Auth + Firestore) |
| 公交 API | OneBusAway REST API |
| 天气 API | OpenWeatherMap API |
| 地图/步行 | Google Maps Distance Matrix API |
| 环境变量 | `.env` (Vite 格式: `VITE_xxx`) |

---

## 组件结构

```
App
├── AuthContext (Context Provider，管理登录状态)
├── Navbar (导航栏，显示登录状态和登出按钮)
├── LoginPage
│   └── LoginForm (name + password + login button)
├── MainPage (核心页面，三栏布局)
│   ├── SavedRoutes (左侧：已保存路线列表，点击自动填入)
│   ├── SearchPanel (中间：From/To 输入 + 地图占位 + Search 按钮)
│   │   ├── RouteInput (From 输入框)
│   │   ├── RouteInput (To 输入框)
│   │   ├── MapDisplay (地图展示区域)
│   │   └── SearchButton
│   └── ResultPanel (右侧：查询结果)
│       ├── BusInfo (公交到达时间和路线)
│       ├── WeatherInfo (天气状况)
│       └── Recommendation (最终推荐 + 理由)
└── HistoryPage (可选：查询历史 + 每周步行统计)
```

---

## 页面路由

```
/login        → LoginPage
/             → MainPage (需要登录)
/history      → HistoryPage (可选 stretch goal)
```

用 `ProtectedRoute` 组件包裹需要登录的页面。

---

## 数据流

```
用户输入 from + to
        ↓
SearchButton 点击
        ↓
并行发起三个 API 请求：
  ① Google Maps → 步行时间（分钟）
  ② OneBusAway → 附近站点 + 最近一班车到达时间（分钟）
  ③ OpenWeatherMap → 当前天气（晴/雨/雪/云）
        ↓
recommendationEngine(walkTime, busWaitTime, weather)
  → 返回推荐结果 + 理由文字
        ↓
ResultPanel 渲染结果
        ↓
（可选）Firestore 保存本次查询记录
```

---

## 推荐算法逻辑（recommendationEngine）

```javascript
function recommend(walkMinutes, busWaitMinutes, weather) {
  const isRaining = ['Rain', 'Drizzle', 'Thunderstorm', 'Snow'].includes(weather);
  const busTotal = busWaitMinutes; // 可加上预估乘车时间

  if (isRaining && busWaitMinutes <= 10) {
    return { mode: 'bus', reason: `下雨天，公交 ${busWaitMinutes} 分钟后到达，建议等车` };
  }
  if (!isRaining && walkMinutes <= 15) {
    return { mode: 'walk', reason: `天气晴好，步行仅需 ${walkMinutes} 分钟` };
  }
  if (busWaitMinutes <= 3) {
    return { mode: 'bus', reason: `公交 ${busWaitMinutes} 分钟后到，快去赶车！` };
  }
  if (walkMinutes < busWaitMinutes) {
    return { mode: 'walk', reason: `步行 ${walkMinutes} 分钟比等公交 ${busWaitMinutes} 分钟更快` };
  }
  return { mode: 'bus', reason: `公交 ${busWaitMinutes} 分钟后到，比走路（${walkMinutes} 分钟）更省力` };
}
```

---

## Firebase 数据结构

```
Firestore
└── users/{uid}
    ├── savedRoutes: [{ from: string, to: string, label: string }]
    └── queryHistory: [{ from, to, result, timestamp }]  ← stretch goal
```

---

## 开发阶段

### Phase 1：静态 UI + 组件骨架（先不接 API）
- [ ] `npx create vite@latest walk-or-ride -- --template react` 初始化项目
- [ ] 安装依赖：`npm install react-router-dom firebase react-bootstrap bootstrap`
- [ ] 搭建三栏布局（参考 proposal 的线框图）
- [ ] 实现所有组件的静态版本，用假数据渲染
- [ ] 配置 React Router，实现页面跳转

### Phase 2：接入实时数据
- [ ] 在 `.env` 里配置所有 API key（`VITE_OPENWEATHER_KEY` 等）
- [ ] 实现 `useWalkTime(from, to)` hook → 调用 Google Maps API
- [ ] 实现 `useBusArrival(lat, lng)` hook → 调用 OneBusAway API
- [ ] 实现 `useWeather(lat, lng)` hook → 调用 OpenWeatherMap API
- [ ] 实现 `recommendationEngine` 函数
- [ ] 并行调用三个 API（`Promise.all`），展示 loading 状态

### Phase 3：Firebase 登录 + 保存路线
- [ ] 配置 Firebase 项目，开启 Auth（Email/Password）和 Firestore
- [ ] 实现 `AuthContext`，提供 `user`, `login`, `logout`
- [ ] LoginPage 实现登录/注册表单
- [ ] 实现 `ProtectedRoute`，未登录跳转 `/login`
- [ ] SavedRoutes 组件：从 Firestore 读取 + 保存常用路线

### Phase 4：完善 + Stretch Goals
- [ ] 响应式设计（移动端适配）
- [ ] 错误处理（API 请求失败、地址找不到等）
- [ ] Loading skeleton
- [ ] （Stretch）HistoryPage：查询历史 + 每周步行统计
- [ ] （Stretch）地图上显示实时公交位置

---

## 注意事项

1. **OneBusAway API** 需要先把地址转成经纬度（可用 Google Geocoding API 或 OpenWeatherMap 的 geocoding 接口）
2. **Google Maps Distance Matrix API** 有费用，建议开发阶段设置每日限额
3. **API Key 安全**：所有 key 存 `.env`，`.env` 加入 `.gitignore`，不要提交到 GitHub
4. **CORS**：OneBusAway 支持浏览器直接请求；Google Maps 需要在 Console 配置允许的域名

---

## 文件结构建议

```
src/
├── components/
│   ├── Navbar.jsx
│   ├── LoginForm.jsx
│   ├── SavedRoutes.jsx
│   ├── SearchPanel.jsx
│   ├── MapDisplay.jsx
│   ├── BusInfo.jsx
│   ├── WeatherInfo.jsx
│   └── Recommendation.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── MainPage.jsx
│   └── HistoryPage.jsx
├── hooks/
│   ├── useWalkTime.js
│   ├── useBusArrival.js
│   └── useWeather.js
├── context/
│   └── AuthContext.jsx
├── utils/
│   └── recommendationEngine.js
├── firebase.js
└── App.jsx
```
