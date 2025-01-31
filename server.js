const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const TodoModel = require('./models/Todo');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/TODO')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Auth routes
app.use('/api/auth', authRoutes);

// Todo routes
app.post('/add', authMiddleware, async (req, res) => {
    try {
        const { task, dueDate } = req.body;
        if (!task || !dueDate) {
            return res.status(400).json({ message: 'Task and due date are required' });
        }

        const todo = await TodoModel.create({
            task,
            dueDate: new Date(dueDate),
            user: req.user.id
        });
        res.json(todo);
    } catch (err) {
        console.error('Error creating todo:', err);
        res.status(500).json({ message: err.message });
    }
});

app.get('/get', authMiddleware, async (req, res) => {
    try {
        const todos = await TodoModel.find({ user: req.user.id })
            .sort({ dueDate: 1 });
        res.json(todos);
    } catch (err) {
        console.error('Error fetching todos:', err);
        res.status(500).json({ message: err.message });
    }
});

app.put('/edit/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const todo = await TodoModel.findOne({ _id: id, user: req.user.id });
        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }
        
        todo.done = !todo.done;
        const result = await todo.save();
        res.json(result);
    } catch (err) {
        res.status(500).json(err);
    }
});

app.put('/update/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { task } = req.body;
        const todo = await TodoModel.findOneAndUpdate(
            { _id: id, user: req.user.id },
            { task },
            { new: true }
        );
        
        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }
        
        res.json(todo);
    } catch (err) {
        res.status(500).json(err);
    }
});

app.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const todo = await TodoModel.findOneAndDelete({ _id: id, user: req.user.id });
        
        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }
        
        res.json({ message: 'Todo deleted successfully' });
    } catch (err) {
        res.status(500).json(err);
    }
});

// Protected Todo routes
app.post('/api/todos', authMiddleware, async (req, res) => {
    try {
        const { task } = req.body;
        const todo = await TodoModel.create({ 
            task,
            user: req.user
        });
        res.json(todo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/todos', authMiddleware, async (req, res) => {
    try {
        const todos = await TodoModel.find({ user: req.user });
        res.json(todos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/todos/:id', authMiddleware, async (req, res) => {
    try {
        const todo = await TodoModel.findOne({ _id: req.params.id, user: req.user });
        if (!todo) return res.status(404).json({ message: 'Todo not found' });
        
        todo.done = !todo.done;
        await todo.save();
        res.json(todo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/todos/update/:id', authMiddleware, async (req, res) => {
    try {
        const { task } = req.body;
        const todo = await TodoModel.findOneAndUpdate(
            { _id: req.params.id, user: req.user },
            { task },
            { new: true }
        );
        if (!todo) return res.status(404).json({ message: 'Todo not found' });
        res.json(todo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/todos/:id', authMiddleware, async (req, res) => {
    try {
        const todo = await TodoModel.findOneAndDelete({ _id: req.params.id, user: req.user });
        if (!todo) return res.status(404).json({ message: 'Todo not found' });
        res.json(todo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
