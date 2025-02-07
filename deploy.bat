@echo off
cls
color 0A

:: Muda para o diretório do projeto (onde o .bat está)
cd /d "%~dp0"

echo ===================================
echo    Deploy Automatico - MR Drones
echo ===================================
echo.

:: Verifica se o Git está instalado
echo Verificando instalacao do Git...
where git >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo ERRO: Git nao encontrado! Por favor, instale o Git primeiro.
    pause
    exit /b
)

:: Verifica se é um repositório Git e inicializa se necessário
if not exist .git (
    echo Inicializando repositorio Git...
    git init
    git remote add origin https://github.com/richardspanhol/mr_drones.git
)

:: Configura diretório como seguro
echo.
echo Configurando diretorio como seguro...
git config --global --add safe.directory "%CD%"

:: Verifica e mostra alterações
echo.
echo Verificando alteracoes...
git status

:: Adiciona todas as alterações
echo.
echo Adicionando alteracoes...
git add .

:: Cria um commit
echo.
echo Criando commit...
set "data=%date:~0,2%/%date:~3,2%/%date:~6,4% %time:~0,2%:%time:~3,2%"
git commit -m "Atualização: %data%"

:: Envia para o GitHub
echo.
echo Enviando para o GitHub...
echo (Pode demorar alguns segundos)
git push -u origin main
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo ERRO: Falha ao enviar para o GitHub!
    echo Verifique sua conexao e credenciais.
    pause
    exit /b
)

:: Conclusão
color 0A
echo.
echo ===================================
echo    Deploy concluido com sucesso!
echo ===================================
echo.
echo O site sera atualizado em alguns minutos.
echo GitHub Pages: https://richardspanhol.github.io/mr_drones/
echo.
echo Pressione qualquer tecla para sair...
pause > nul 