import appFactory from '@infra/server';


const port = process.env.PORT || 5550;

appFactory
    .map(app => app.listen(port, () => console.log(`server started on port ${ port }`)))
    .ifLeft(console.error)
    .void()
    .run();