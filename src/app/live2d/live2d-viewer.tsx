'use client'

import { useEffect, useRef, useState } from 'react'

/** PIXI Application 实例（CDN 加载，无类型包） */
interface PixiAppInstance {
	stage: { addChild: (child: unknown) => void }
	view: HTMLCanvasElement
	destroy: (opts?: { removeView?: boolean }) => void
}

/** Live2D 模型实例 */
interface Live2DModelInstance {
	anchor: { set: (x: number, y: number) => void }
	x: number
	y: number
	scale: { set: (x: number, y: number) => void }
	motion: (group: string, index?: number, priority?: number) => void
	internalModel?: {
		motionManager?: {
			motionGroups?: Record<string, unknown>
		}
	}
}

const CDN_SCRIPTS = [
	'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/6.2.0/browser/pixi.min.js',
	'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js',
	'https://cdn.jsdelivr.net/npm/pixi-live2d-display/dist/cubism4.min.js'
]

const MODEL_URL = '/live2d/live2dmoc3-1.0/live2dmoc3-1.0/js/Resources/Ganyu/Ganyu.model3.json'

function loadScript(src: string): Promise<void> {
	return new Promise((resolve, reject) => {
		if (document.querySelector(`script[src="${src}"]`)) {
			resolve()
			return
		}
		const script = document.createElement('script')
		script.src = src
		script.crossOrigin = 'anonymous'
		script.onload = () => resolve()
		script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
		document.head.appendChild(script)
	})
}

export default function Live2DViewer() {
	const containerRef = useRef<HTMLDivElement>(null)
	const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
	const [errorMsg, setErrorMsg] = useState<string>('')

	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		let app: PixiAppInstance | null = null

		const init = async () => {
			try {
				for (const src of CDN_SCRIPTS) {
					await loadScript(src)
				}

				const PIXI = (window as unknown as { PIXI: unknown }).PIXI
				if (!PIXI) {
					throw new Error('PIXI not found on window')
				}
				;(window as unknown as { PIXI: unknown }).PIXI = PIXI

				const PIXIApp = (
					PIXI as { Application: new (opts: { view: HTMLCanvasElement; width?: number; height?: number; backgroundAlpha?: number }) => PixiAppInstance }
				).Application

				const Live2DModel = (PIXI as { live2d?: { Live2DModel: { from: (url: string) => Promise<Live2DModelInstance> } } }).live2d?.Live2DModel

				if (!Live2DModel) {
					throw new Error('PIXI.live2d.Live2DModel not found')
				}

				// 读取自适应的宽高（配合 Tailwind 设置的宽高）
				const width = container.clientWidth || 500
				const height = container.clientHeight || 700
				const canvas = document.createElement('canvas')
				canvas.style.width = '100%'
				canvas.style.height = '100%'
				canvas.style.display = 'block'
				container.appendChild(canvas)

				app = new PIXIApp({
					view: canvas,
					width,
					height,
					backgroundAlpha: 0 // 背景透明
				})

				const model = await Live2DModel.from(MODEL_URL)
				app.stage.addChild(model)

				// 调整模型的重心和位置
				model.anchor.set(0.5, 0.5)
				model.x = width / 2
				model.y = height / 2 + 80   // 把她稍微往下按一点，确保头顶在画面内
				model.scale.set(0.09, 0.09) // 调整缩放比例

				// --- 核心新增：防弹版点击互动功能 ---
				// 1. 获取模型内部所有的动作组名称
				const motionGroups = Object.keys(model.internalModel?.motionManager?.motionGroups || {})
				console.log("甘雨自带的动作组名称有:", motionGroups)

				// 2. 将鼠标悬浮在画布上时，光标变为小手形状
				app.view.style.cursor = 'pointer'

				// 3. 监听整个画布的点击事件，绝对不会点空
				// 3. 监听整个画布的点击事件，绝对不会点空
				app.view.addEventListener('pointerdown', () => {
					if (motionGroups.length > 0) {
						// 优先寻找 Tap (点击) 或 Idle (待机) 的动作组
						const targetGroup = motionGroups.includes('Tap') ? 'Tap' : 
						                    (motionGroups.includes('Idle') ? 'Idle' : motionGroups[0])
						
						console.log("准备强制播放动作组:", targetGroup)
						
						// 🔴 关键修复：换成底层的原生 API，使用 startRandomMotion
						try {
							if (model.internalModel && model.internalModel.motionManager) {
								model.internalModel.motionManager.startRandomMotion(targetGroup)
								console.log("动作指令发送成功！")
							}
						} catch (err) {
							console.error("底层播放报错:", err)
						}
					}
				})
				// -------------------------

				setStatus('ready')
			} catch (err) {
				setErrorMsg(err instanceof Error ? err.message : String(err))
				setStatus('error')
			}
		}

		init()

		return () => {
			if (app !== null && typeof app === 'object' && 'destroy' in app && typeof app.destroy === 'function') {
				app.destroy({ removeView: true })
			}
			container.innerHTML = ''
		}
	}, [])

	return (
		// 居中定位：固定在屏幕正中央，限制宽高防止过大
		<div className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 h-[700px] w-[500px] pointer-events-none'>
			{/* pointer-events-auto 保证透明画板的区域可以接受点击 */}
			<div ref={containerRef} className='absolute inset-0 h-full w-full pointer-events-auto' />
			{status === 'loading' && <div className='text-secondary absolute inset-0 flex items-center justify-center'>召唤甘雨中…</div>}
			{status === 'error' && <div className='absolute inset-0 flex items-center justify-center p-4 text-center text-red-500'>{errorMsg}</div>}
		</div>
	)
}
