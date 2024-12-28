<? 


header('Access-Control-Allow-Origin: *');

$array = $_POST['myarray']; 
$nameFile = $_POST['nameFile'];


// Открываем файл, флаг W означает - файл открыт на запись
$f_hdl = fopen("../img/".$nameFile, 'w');

// Записываем в файл $text
fwrite($f_hdl, $array);


// Закрывает открытый файл
fclose($f_hdl);

echo $array;