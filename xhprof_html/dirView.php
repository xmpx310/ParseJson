<?php

$dir = ini_get("xhprof.output_dir");
if(!$_GET['date']){
    echo '<html>
    <frameset cols="15%,85%">
      <frame src="index.php" name="menu">
      <frame src="" name="detail">
    </frameset>
    </html>
    ';
    
    $dirList = scandir($dir);
    foreach($dirList as $dirName){
        if($dirName == '.' || $dirName == '..') continue;
        echo "<a href='{$_SERVER['SCRIPT_NAME']}?date={$dirName}'>{$dirName}</a><br/>";
        
    }
    
    
    exit;
}
