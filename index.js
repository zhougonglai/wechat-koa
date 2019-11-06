const Koa = require('koa');
const WechatAPI = require('co-wechat-api');
const wechat = require('co-wechat');
const OAuth = require('co-wechat-oauth');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');

const util = require('util');
const fs = require('fs');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const loggerAsync = require('./middleware/logger-async');
const { appid, appsecret, token, encodingAESKey } = require('./config');
const { name, version } = require('./package');

const app = new Koa();
const base = new Router();

// console.log('process.env.PORT', process.env.PORT);

const PORT = process.env.PORT || 3333;

app.use(loggerAsync());
app.use(bodyParser());

base
	.all(
		'/',
		wechat({ appid, appsecret, token, encodingAESKey }, true).middleware(
			async (message, ctx) => {
				const { openid } = ctx.query;
				switch (message.MsgType) {
					case 'event':
						switch (message.Event) {
							case 'unsubscribe': // 退订事件
								break;
							case 'subscribe': // 关注事件
								const api = new WechatAPI(appid, appsecret);
								await api.updateRemark(openid, 'remarked');
								const user = await api.getUser(openid);
								const createMenu = await api.createMenu({
									button: [
										{
											type: 'view',
											name: '天马报告',
											url: 'http://bg.yifudai.com',
										},
									],
								});
								return `欢迎👏关注,${user.nickname} ${
									user.sex === 1 ? '🚹' : '🚺'
								} , 来自${user.city}`;
							default:
								return '';
						}
						break;
					case 'text':
						console.log(message.Content);
						break;
					default:
						return '';
				}
				return '';
			},
		),
	)
	.get('/access', async ctx => {
		console.log('access');
		ctx.body = 'access';
		return 'access';
	})
	.get('/getJsConfig', async ctx => {
		const api = new WechatAPI(appid, appsecret);
		const { url } = ctx.query;
		const param = {
			debug: true,
			jsApiList: ['chooseWXPay'],
			url,
		};
		const result = await api.getJsConfig(param);
		console.log(api);
		ctx.body = result;
	})
	.get('/token', async ctx => {
		const client = new OAuth(appid, appsecret);
		console.log(client);
		ctx.body = 'token';
		return 'token';
	});

app.use(base.routes()).use(base.allowedMethods());

app.listen(PORT, () => {
	console.log(`[demo] start-quick is starting at port ${PORT}`);
});
