#!/bin/bash

# ALNTool Development Server Startup Script
# Optimized for WSL2 with tmux session management

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="/home/spide/projects/GitHub/ALNTool"
BACKEND_DIR="$PROJECT_ROOT/storyforge/backend"
FRONTEND_DIR="$PROJECT_ROOT/storyforge/frontend"
SESSION_NAME="alntool"
BACKEND_PORT=3001
FRONTEND_PORT=3000  # Vite default from config, may auto-increment if in use

# Functions
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Header
echo "═══════════════════════════════════════════════════════════════"
echo "  ALNTool Development Server Startup (WSL2 Optimized)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    print_error "tmux is not installed. Please run: sudo apt install tmux"
    exit 1
fi

# Check if already running
if tmux has-session -t $SESSION_NAME 2>/dev/null; then
    print_warning "Development servers may already be running in tmux session '$SESSION_NAME'"
    echo ""
    echo "Options:"
    echo "  1) Attach to existing session: tmux attach -t $SESSION_NAME"
    echo "  2) Kill existing session: tmux kill-session -t $SESSION_NAME"
    echo ""
    read -p "Would you like to kill the existing session and start fresh? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        tmux kill-session -t $SESSION_NAME
        print_status "Killed existing session"
    else
        print_status "Attaching to existing session..."
        tmux attach -t $SESSION_NAME
        exit 0
    fi
fi

# Check ports
if check_port $BACKEND_PORT; then
    print_warning "Port $BACKEND_PORT is already in use"
    PID=$(lsof -ti:$BACKEND_PORT)
    echo "  Process using port: PID $PID"
    read -p "  Kill this process? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill -9 $PID
        print_status "Killed process on port $BACKEND_PORT"
    else
        print_error "Cannot continue with port $BACKEND_PORT in use"
        exit 1
    fi
fi

if check_port $FRONTEND_PORT; then
    print_warning "Port $FRONTEND_PORT is already in use"
    PID=$(lsof -ti:$FRONTEND_PORT)
    echo "  Process using port: PID $PID"
    read -p "  Kill this process? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill -9 $PID
        print_status "Killed process on port $FRONTEND_PORT"
    else
        print_error "Cannot continue with port $FRONTEND_PORT in use"
        exit 1
    fi
fi

# Check directories exist
if [ ! -d "$BACKEND_DIR" ]; then
    print_error "Backend directory not found: $BACKEND_DIR"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    print_error "Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

# Check .env file
if [ ! -f "$BACKEND_DIR/.env" ]; then
    print_warning "No .env file found in backend directory"
    if [ -f "$BACKEND_DIR/.env.example" ]; then
        echo "  Creating .env from .env.example..."
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        print_status "Created .env file"
    fi
fi

# Check node_modules
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    print_warning "Backend dependencies not installed"
    echo "  Installing backend dependencies..."
    cd "$BACKEND_DIR" && npm install
    print_status "Backend dependencies installed"
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    print_warning "Frontend dependencies not installed"
    echo "  Installing frontend dependencies..."
    cd "$FRONTEND_DIR" && npm install
    print_status "Frontend dependencies installed"
fi

# Create tmux session
print_status "Creating tmux session '$SESSION_NAME'"

# Start tmux session with backend
tmux new-session -d -s $SESSION_NAME -c "$BACKEND_DIR" -n "servers"
tmux send-keys -t $SESSION_NAME:0.0 "echo 'Starting Backend Server...'" C-m
tmux send-keys -t $SESSION_NAME:0.0 "npm run dev" C-m

# Split window and start frontend
tmux split-window -h -t $SESSION_NAME:0 -c "$FRONTEND_DIR"
tmux send-keys -t $SESSION_NAME:0.1 "echo 'Starting Frontend Server...'" C-m
tmux send-keys -t $SESSION_NAME:0.1 "npm run dev" C-m

# Create a third pane for monitoring
tmux split-window -v -t $SESSION_NAME:0.0 -c "$PROJECT_ROOT"
tmux send-keys -t $SESSION_NAME:0.2 "echo 'Monitoring Panel - Commands:'" C-m
tmux send-keys -t $SESSION_NAME:0.2 "echo '  Check backend: curl http://localhost:$BACKEND_PORT/health'" C-m
tmux send-keys -t $SESSION_NAME:0.2 "echo '  Check frontend: curl http://localhost:$FRONTEND_PORT'" C-m
tmux send-keys -t $SESSION_NAME:0.2 "echo '  Database: sqlite3 $BACKEND_DIR/data/production.db'" C-m

# Wait a moment for servers to start
print_status "Waiting for servers to start..."
sleep 3

# Display success message
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}  Development servers are starting!${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Access Points:"
echo "  • Frontend:    http://localhost:$FRONTEND_PORT (check terminal for actual port)"
echo "  • Backend API: http://localhost:$BACKEND_PORT"
echo ""
echo "  NOTE: Vite may use a different port if $FRONTEND_PORT is in use."
echo "        Check the frontend pane for the actual URL."
echo ""
echo "  tmux Commands:"
echo "  • Attach to session:  tmux attach -t $SESSION_NAME"
echo "  • Detach from session: Ctrl+b d"
echo "  • Switch panes:       Ctrl+b arrow keys"
echo "  • Kill session:       tmux kill-session -t $SESSION_NAME"
echo ""
echo "  WSL2 Network Access:"
echo "  • From Windows:       Use localhost URLs above"
echo "  • From other devices: Use Windows IP + port"
echo "  • Windows IP:         $(ip route show | grep -i default | awk '{ print $3}')"
echo ""
echo "═══════════════════════════════════════════════════════════════"

# Attach to session
read -p "Attach to tmux session now? (Y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    tmux attach -t $SESSION_NAME
fi