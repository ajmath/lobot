![](https://camo.githubusercontent.com/547c6da94c16fedb1aa60c9efda858282e22834f/687474703a2f2f7075626c69632e7365727665726c6573732e636f6d2f6261646765732f76332e737667) ![](https://camo.githubusercontent.com/d59450139b6d354f15a2252a47b457bb2cc43828/68747470733a2f2f696d672e736869656c64732e696f2f6e706d2f6c2f7365727665726c6573732e737667)

# lobot

Based on [johnagan/serverless-slack-app](https://github.com/johnagan/serverless-slack-app)

Steps for getting started on developing/deploying the chatbot:
1. Install serverless
```
npm install -g serverless
```
2. Clone this repo and deploy (assuming aws credentials available via environment)
```
git clone git@github.com:ajmath/lobot.git
cd lobot
npm install
serverless deploy
```
3. Follow steps at [johnagan/serverless-slack-app](https://github.com/johnagan/serverless-slack-app#create-a-slack-app) on creating a slack app.  Additionally, you'll need to:
  * Add bot event subscription to message.channels
  * Provide POST endpoint in the slack event subscription configuration page
  * Click the "Enable Events" checkbox
4. Copy `env/examples.env` to something like `env/dev.env` and populate with slack tokens found when creating the app
5. Deploy using `serverless deploy`
