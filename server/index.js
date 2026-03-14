const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 隐私保护：处理完成后立即清理内存
app.post('/api/remove-bg', async (req, res) => {
  let imageBuffer = null;
  
  try {
    // 1. 图片直接在内存中处理，不写入磁盘
    imageBuffer = req.body.image;
    
    if (!imageBuffer) {
      return res.status(400).json({ error: '请上传图片' });
    }

    // 2. 转换为 Buffer
    const buffer = Buffer.from(imageBuffer, 'base64');
    
    const form = new FormData();
    form.append('image_file', buffer, {
      filename: 'image.png',
      contentType: 'image/png'
    });

    // 3. 调用 Clipdrop API
    const response = await axios.post(
      'https://clipdrop-api.co/remove-background/v1',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'x-api-key': process.env.CLIPDROP_API_KEY || ''
        },
        responseType: 'arraybuffer',
        timeout: 30000
      }
    );

    // 4. 清理原始图片内存
    imageBuffer = null;
    buffer = null;

    // 5. 返回结果 (base64)
    const resultBase64 = Buffer.from(response.data).toString('base64');
    res.json({ image: resultBase64 });
    
  } catch (error) {
    imageBuffer = null;
    console.error('处理失败:', error.message);
    res.status(500).json({ error: '处理失败，请重试' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
