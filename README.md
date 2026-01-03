# Portfolio Site

ブログと写真のポートフォリオサイト

## 🛠 技術スタック

- [Hugo](https://gohugo.io/) - 静的サイトジェネレーター
- [GitHub Pages](https://pages.github.com/) - ホスティング
- [GitHub Actions](https://github.com/features/actions) - 自動デプロイ

## 🚀 セットアップ

### 1. Hugo のインストール

```bash
# macOS
brew install hugo

# Windows
choco install hugo-extended

# Ubuntu
snap install hugo
```

### 2. テーマのインストール

```bash
git submodule add https://github.com/adityatelange/hugo-PaperMod themes/papermod
```

### 3. 開発サーバー起動

```bash
hugo server -D
```

ブラウザで http://localhost:1313 にアクセス

## 📝 記事の作成

```bash
# 新しいブログ記事
hugo new blog/記事のタイトル.md
```

## 🔄 サイトの更新方法

### ブログ記事を追加する

```bash
# 1. 新しい記事を作成
hugo new blog/記事のタイトル.md

# 2. content/blog/ にできたファイルを編集
#    - front matter（タイトル、日付など）を設定
#    - Markdown で本文を書く
```

### 写真を追加する

```bash
# 1. 画像を static/images/ に配置
cp 写真.jpg static/images/

# 2. 写真ページを作成
hugo new photos/写真のタイトル.md

# 3. content/photos/ のファイルを編集
```

### ローカルで確認する

```bash
hugo server -D
```

ブラウザで http://localhost:1313 にアクセスして確認。
`-D` オプションで下書き（`draft: true`）も表示される。

### 公開する

```bash
git add .
git commit -m "コミットメッセージ"
git push origin master
```

## 🚢 デプロイ

`master` ブランチにプッシュすると、GitHub Actions で自動的にデプロイされます。

## 📁 ディレクトリ構成

```
.
├── archetypes/      # 記事テンプレート
├── content/
│   ├── blog/        # ブログ記事
│   ├── photos/      # 写真ページ
│   └── about.md     # Aboutページ
├── static/
│   └── images/      # 画像ファイル
├── themes/          # Hugoテーマ
├── config.toml      # Hugo設定
└── .github/
    └── workflows/   # GitHub Actions
```

## 📜 ライセンス

MIT License
