import urllib.request
import json

url = "http://localhost:3000/api/refine-question"
payload = {
    "rawText": "現場で角パイプを浸漬したら激しい沸騰音とボイリングが発生して亜鉛がハネた。これって水蒸気爆発の前兆？どうすればいい？",
    "categoryId": "CAT-5"
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        res_body = response.read().decode('utf-8')
        result = json.loads(res_body)
        print("=== SUCCESS: API Response Status 200 ===")
        print("1. 生成された質問タイトル:", result['data']['title'])
        print("2. 具体化質問文:", result['data']['refined_question'])
        print("3. AI標準理論:", result['data']['ai_standard_answer']['theory'])
        print("4. JIS合否基準:", result['data']['ai_standard_answer']['standard_criteria'])
        print("5. 現場作業員要約判定:", result['data']['worker_summary']['verdict_ok_ng'])
        print("6. 今すぐやる処置:", result['data']['worker_summary']['immediate_action'])
        print("7. ⚠️ 絶対やってはいけないこと:", result['data']['worker_summary']['forbidden_action'])
        print("8. 根本原因カテゴリ:", result['data']['cause_category'])
        print("9. 処置カテゴリ:", result['data']['action_category'])
        print("10. 品質バイブルレコード生成:", result['knowledge']['id'], "タイトル:", result['knowledge']['question_title'])
except Exception as e:
    print("Error:", e)
