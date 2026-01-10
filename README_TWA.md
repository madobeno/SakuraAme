# TWA (Trusted Web Activity) セットアップガイド

## 概要
このアプリをGoogle PlayでリリースするためのTWA設定手順です。

## 必要な準備

### 1. GitHub Pagesの設定
1. リポジトリのSettings > PagesでGitHub Pagesを有効化
2. デプロイされたURLを確認（例: `https://yourusername.github.io/SAKURA-AME/`）

### 2. Androidアプリのビルド

#### 必要な環境
- Android Studio
- JDK 8以上
- Android SDK 21以上

#### 手順

1. **アプリ署名キーの生成**
```bash
keytool -genkey -v -keystore sakura-ame-release.keystore -alias sakura-ame -keyalg RSA -keysize 2048 -validity 10000
```

2. **SHA-256フィンガープリントの取得**
```bash
keytool -list -v -keystore sakura-ame-release.keystore -alias sakura-ame
```

3. **assetlinks.jsonの更新**
   - `android/.well-known/assetlinks.json`の`YOUR_SHA256_FINGERPRINT_HERE`を実際のフィンガープリントに置き換え
   - GitHub Pagesの`.well-known/assetlinks.json`にも同じ内容を配置

4. **AndroidManifest.xmlの更新**
   - `android/app/src/main/AndroidManifest.xml`の`yourusername.github.io`を実際のGitHub PagesのURLに置き換え

5. **アプリのビルド**
```bash
cd android
./gradlew assembleRelease
```

### 3. Google Play Consoleでの設定

1. Google Play Consoleにアプリを登録
2. アプリの詳細情報を入力
3. リリース > 内部テスト/クローズドテスト/オープンテストでAPKをアップロード
4. ストア掲載情報を入力

## フリーミアムモデル

現在の実装では、`localStorage`を使用してプレミアム状態を保存しています。
Google Playの課金システムと統合する場合は、以下の対応が必要です：

1. Google Play Billing Libraryの統合
2. プレミアム状態のサーバー同期（オプション）
3. 復元購入機能の実装

## 注意事項

- TWAはAndroid 5.0以上（API 21以上）が必要です
- Chrome Custom Tabsを使用するため、Chromeがインストールされている必要があります
- デジタルアセットリンクの検証には、HTTPSが必要です

## 参考リンク

- [TWA Documentation](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Digital Asset Links](https://developers.google.com/digital-asset-links)
