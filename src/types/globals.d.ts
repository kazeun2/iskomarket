// Allow importing stylesheets and common static assets from TypeScript
// This prevents `Cannot find module or type declarations` errors for side-effect imports like `import './index.css'`

declare module '*.css'
declare module '*.scss'
declare module '*.sass'
declare module '*.less'

declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.gif'
declare module '*.webp'

declare module '*.svg' {
  const content: string
  export default content
}
