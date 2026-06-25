@echo off
set /p msg="Digite a mensagem do commit: "
if "%msg%"=="" set msg="update: implementacao de melhorias e correcoes"
echo Adicionando alteracoes...
git add .
echo Criando commit com a mensagem: %msg%
git commit -m "%msg%"
echo Enviando para o GitHub...
git push
echo Concluido!
pause
