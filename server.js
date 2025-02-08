import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// Configuração do caminho do diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads")); // Salva as imagens na pasta "uploads"
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nome único para o arquivo
  },
});

const upload = multer({ storage });

// Middleware
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve as imagens estáticas

// Rota para upload de imagem e cadastro de produto
app.post("/produtos", upload.single("imagem"), async (req, res) => {
  try {
    const { categoria, nome, descricao, valor } = req.body;
    const imagem = req.file ? `/uploads/${req.file.filename}` : null; // URL da imagem

    const produto = await prisma.produtos.create({
      data: {
        categoria,
        nome,
        descricao,
        valor: parseFloat(valor),
        imagem,
      },
    });

    res.status(201).json(produto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
});

// Rota para listar todos os produtos
app.get("/produtos", async (req, res) => {
  try {
    const produtos = await prisma.produtos.findMany();
    res.status(200).json(produtos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

// Rota para buscar categorias únicas
app.get("/categorias", async (req, res) => {
  try {
    const categorias = await prisma.produtos.findMany({
      select: {
        categoria: true,
      },
      distinct: ["categoria"],
    });

    const categoriasUnicas = categorias.map((item) => item.categoria);
    res.status(200).json(categoriasUnicas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar categorias" });
  }
});

// Rota para editar um produto pelo ID
app.put("/produtos/:id", upload.single("imagem"), async (req, res) => {
  try {
    const { id } = req.params; // ID do produto a ser editado
    const { categoria, nome, descricao, valor } = req.body;

    // Verifica se o produto existe
    const produtoExistente = await prisma.produtos.findUnique({
      where: { id: id },
    });

    if (!produtoExistente) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    // Atualiza os dados do produto
    const produtoAtualizado = await prisma.produtos.update({
      where: { id: id },
      data: {
        categoria: categoria || produtoExistente.categoria,
        nome: nome || produtoExistente.nome,
        descricao: descricao || produtoExistente.descricao,
        valor: valor ? parseFloat(valor) : produtoExistente.valor,
        imagem: req.file ? `/uploads/${req.file.filename}` : produtoExistente.imagem, // Atualiza a imagem se uma nova for enviada
      },
    });

    res.status(200).json(produtoAtualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao editar produto" });
  }
});

// Rota para deletar um produto pelo ID
app.delete("/produtos/:id", async (req, res) => {
  try {
    const { id } = req.params; // ID do produto a ser deletado

    // Verifica se o produto existe
    const produtoExistente = await prisma.produtos.findUnique({
      where: { id: id },
    });

    if (!produtoExistente) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    // Deleta o produto
    await prisma.produtos.delete({
      where: { id: id },
    });

    res.status(200).json({ message: "Produto deletado com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar produto" });
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});