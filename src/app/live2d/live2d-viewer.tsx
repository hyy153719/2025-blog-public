// --- 新增：防弹版互动功能 ---
				// 1. 在控制台打印看看甘雨到底有哪些动作组
				const motionGroups = Object.keys(model.internalModel?.motionManager?.motionGroups || {})
				console.log("甘雨自带的动作组名称有:", motionGroups)

				// 2. 直接给整个 Canvas 画布绑定原生点击事件（绝对不会点空）
				app.view.style.cursor = 'pointer' // 只要鼠标移到画布区域，就变成小手
				
				app.view.addEventListener('pointerdown', () => {
					// console.log("画布被点击了！") // 你可以按 F12 打开控制台看有没有打印这句话
					
					if (motionGroups.length > 0) {
						// 优先找有没有叫 'Tap' 或 'Idle' 的动作组，没有就直接播放列表里的第一个组
						const targetGroup = motionGroups.includes('Tap') ? 'Tap' : 
						                    (motionGroups.includes('Idle') ? 'Idle' : motionGroups[0])
						
						// pixi-live2d-display 专属的播放动作 API
						model.motion(targetGroup)
					}
				})
				// -------------------------
