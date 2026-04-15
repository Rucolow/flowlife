# Videos

スロー映像ファイルをこのディレクトリに配置する。

## ファイル命名規則

`src/data/articles.ts` で指定されている通り、各記事につき 2 本:

```
paper-crane-1.mp4      paper-crane-2.mp4
tram-silence-1.mp4     tram-silence-2.mp4
floating-torii-1.mp4   floating-torii-2.mp4
deer-island-1.mp4      deer-island-2.mp4
autumn-leaf-1.mp4      autumn-leaf-2.mp4
oyster-morning-1.mp4   oyster-morning-2.mp4
bridge-count-1.mp4     bridge-count-2.mp4
eternal-flame-1.mp4    eternal-flame-2.mp4
iron-spatula-1.mp4     iron-spatula-2.mp4
island-ferry-1.mp4     island-ferry-2.mp4
```

1 本目は `aspect: "16 / 9"`、2 本目は `aspect: "21 / 9"` が既定。
必要なら `src/data/articles.ts` で `aspect` を個別に上書きできる。

## 推奨仕様

- 形式: MP4 (H.264)
- 音声: なし（muted でループ再生される）
- ループ: ファイル自体がシームレスループになっていること
- エンコード例:
  ```
  ffmpeg -i input.mov -c:v libx264 -crf 22 -an -movflags +faststart out.mp4
  ```

## 未配置のときの挙動

ファイルが存在しない場合、`SlowVideo` は 404 を出すのではなく、
グラデーション + "slow motion" ラベルのプレースホルダーを表示する
（実装上は `<video src="...">` が再生失敗しても枠は崩れない）。
