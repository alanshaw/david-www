import levelSession from 'level-session'
export default ({app, db}) => app.use(levelSession({ db }))
