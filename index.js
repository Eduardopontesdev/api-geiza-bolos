import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";

// Configuração do caminho do diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Rota para cadastro de produto com URL da imagem
app.post("/produtos", async (req, res) => {
  try {
    const { categoria, nome, descricao, valor, imagem } = req.body; // imagem agora é uma URL

    const produto = await prisma.produtos.create({
      data: {
        categoria,
        nome,
        descricao,
        valor: parseFloat(valor),
        imagem, // Salva a URL da imagem
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
app.put("/produtos/:id", async (req, res) => {
  try {
    const { id } = req.params; // ID do produto a ser editado
    const { categoria, nome, descricao, valor, imagem } = req.body; // imagem agora é uma URL

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
        imagem: imagem || produtoExistente.imagem, // Atualiza a URL da imagem se fornecida
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