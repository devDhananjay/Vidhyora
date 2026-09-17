#!/bin/bash

# Enable HTTPS for Next.js Dev Server
# Required for camera access on Safari with IP addresses

echo "🔐 Setting up HTTPS for Next.js Development..."
echo ""

# Install mkcert if not already installed
if ! command -v mkcert &> /dev/null; then
    echo "📦 Installing mkcert..."
    if command -v brew &> /dev/null; then
        brew install mkcert
    else
        echo "❌ Please install Homebrew first: https://brew.sh/"
        exit 1
    fi
fi

# Create local CA
echo "🔧 Creating local Certificate Authority..."
mkcert -install

# Create certificates
echo "📜 Generating SSL certificates..."
cd /Users/meondev/Desktop/VIDYORA
mkdir -p .cert
cd .cert

# Generate cert for localhost and local IP
mkcert localhost 192.168.29.7 127.0.0.1 ::1

echo ""
echo "✅ Certificates created!"
echo ""
echo "📝 Update your package.json dev script to:"
echo ""
echo '  "dev": "next dev --experimental-https --experimental-https-key .cert/localhost+3-key.pem --experimental-https-cert .cert/localhost+3.pem"'
echo ""
echo "Then run: npm run dev"
echo ""
echo "Access via: https://192.168.29.7:3000"
echo ""
