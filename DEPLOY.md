# 🚀 溶融亜鉛めっき「技術伝承AIバイブル」デプロイ手順書

## 1. 環境情報
* **本番URL:** https://galva-tech-bible.vercel.app/
* **本番デプロイブランチ:** `main`
* **作業ブランチ:** `master` / `main`
* **GitHub Remote:**
  * origin: https://github.com/shuji8001-rgb/galva-ai-bible.git
  * origin2: https://github.com/shuji8001-rgb/galva-ai-bible2.git

## 2. デプロイ実行コマンド
```powershell
npx tsc --noEmit
& 'C:\Program Files\Git\cmd\git.exe' add -A
& 'C:\Program Files\Git\cmd\git.exe' commit -m "update message"
& 'C:\Program Files\Git\cmd\git.exe' checkout main
& 'C:\Program Files\Git\cmd\git.exe' merge master
& 'C:\Program Files\Git\cmd\git.exe' push origin main
& 'C:\Program Files\Git\cmd\git.exe' push origin master
& 'C:\Program Files\Git\cmd\git.exe' push origin2 main
& 'C:\Program Files\Git\cmd\git.exe' push origin2 master
```
