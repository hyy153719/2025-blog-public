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

				const width = container.clientWidth || 350
				const height = container.clientHeight || 550
				const canvas = document.createElement('canvas')
				canvas.style.width = '100%'
				canvas.style.height = '100%'
				canvas.style.display = 'block'
				container.appendChild(canvas)

				app = new PIXIApp({
					view: canvas,
					width,
					height,
					backgroundAlpha: 0
				})

				const model = await Live2DModel.from(MODEL_URL)
				app.stage.addChild(model)

				model.anchor.set(0.5, 0.5)
				model.x = width / 2
				model.y = height / 2 + 80   // 把她稍微往下按一点，确保头顶在画面内
				model.scale.set(0.09, 0.09) // 再稍微缩小一点点，显得更精致
				
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

// 🔴 关键修改：去掉了圆角(rounded-full)和正方形(aspect-square)
// 改成了 fixed 悬浮定位，固定在右下角 (bottom-0 right-0)，并设置了固定的宽高限制
	return (
		<div className='fixed bottom-0 right-0 z-50 h-[550px] w-[350px] pointer-events-none'>
			<div ref={containerRef} className='absolute inset-0 h-full w-full pointer-events-auto' />
			{status === 'loading' && <div className='text-secondary absolute inset-0 flex items-center justify-center'>加载甘雨中…</div>}
			{status === 'error' && <div className='absolute inset-0 flex items-center justify-center p-4 text-center text-red-500'>{errorMsg}</div>}
		</div>
	)
}
