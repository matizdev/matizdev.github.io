<?php
class TeamSpeakQuery {
    private $host;
    private $port;
    private $socket;

    public function __construct($host, $port) {
        $this->host = $host;
        $this->port = $port;
        $this->connect();
    }

    private function connect() {
        $this->socket = fsockopen($this->host, $this->port, $errno, $errstr, 5);
        if (!$this->socket) {
            die("Could not connect to TeamSpeak server: $errstr ($errno)");
        }
        $this->read();
    }

    private function read() {
        $response = '';
        while ($line = fgets($this->socket)) {
            $response .= $line;
            if (strpos($line, 'error') !== false) {
                break;
            }
        }
        return $response;
    }

    public function sendCommand($command) {
        fwrite($this->socket, $command . "\n");
        return $this->read();
    }

    public function close() {
        fclose($this->socket);
    }
}

// Usage
$ts = new TeamSpeakQuery('127.0.0.1', 10011); // Replace with your server IP and query port
echo $ts->sendCommand('login serveradmin your_password'); // Replace with your server admin password
echo $ts->sendCommand('use 1'); // Use the first virtual server
echo $ts->sendCommand('serverinfo');
$ts->close();
?>
