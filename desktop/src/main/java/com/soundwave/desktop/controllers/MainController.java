package com.soundwave.desktop.controllers;

import com.soundwave.desktop.models.MusicTrack;
import com.soundwave.desktop.services.SoundWaveApiClient;
import java.util.concurrent.CompletionException;
import javafx.application.Platform;
import javafx.beans.property.ReadOnlyStringWrapper;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.media.Media;
import javafx.scene.media.MediaPlayer;

public class MainController {
    @FXML private TextField emailField;
    @FXML private PasswordField passwordField;
    @FXML private TextField displayNameField;
    @FXML private TextField searchField;
    @FXML private TableView<MusicTrack> musicTable;
    @FXML private TableColumn<MusicTrack, String> titleColumn;
    @FXML private TableColumn<MusicTrack, String> artistColumn;
    @FXML private TableColumn<MusicTrack, String> albumColumn;
    @FXML private Label statusLabel;
    @FXML private Label playerLabel;
    @FXML private Button playButton;
    @FXML private javafx.scene.layout.VBox signInPanel;
    @FXML private javafx.scene.layout.VBox libraryPanel;

    private final SoundWaveApiClient api = new SoundWaveApiClient();
    private MediaPlayer player;

    @FXML
    private void initialize() {
        titleColumn.setCellValueFactory(cell -> new ReadOnlyStringWrapper(cell.getValue().title()));
        artistColumn.setCellValueFactory(cell -> new ReadOnlyStringWrapper(cell.getValue().artistName()));
        albumColumn.setCellValueFactory(cell -> new ReadOnlyStringWrapper(cell.getValue().albumTitle()));
        musicTable.setPlaceholder(new Label("Le catalogue est encore vide."));
        musicTable.setOnMouseClicked(event -> {
            if (event.getClickCount() == 2) {
                playSelected();
            }
        });
    }

    @FXML
    private void handleLogin() {
        if (emailField.getText().isBlank() || passwordField.getText().isBlank()) {
            statusLabel.setText("Saisissez votre adresse e-mail et votre mot de passe.");
            return;
        }
        authenticate(api.login(emailField.getText().trim(), passwordField.getText()));
    }

    @FXML
    private void handleRegister() {
        if (displayNameField.getText().isBlank() || emailField.getText().isBlank() || passwordField.getText().isBlank()) {
            statusLabel.setText("Saisissez votre nom, votre e-mail et un mot de passe.");
            return;
        }
        authenticate(api.register(
            displayNameField.getText().trim(),
            emailField.getText().trim(),
            passwordField.getText()
        ));
    }

    @FXML
    private void searchMusic() {
        statusLabel.setText("Chargement du catalogue…");
        api.searchMusic(searchField.getText()).whenComplete((tracks, failure) ->
            Platform.runLater(() -> {
                if (failure != null) {
                    statusLabel.setText(messageOf(failure));
                    return;
                }
                musicTable.getItems().setAll(tracks);
                statusLabel.setText(tracks.size() + " titre(s) trouvé(s).");
            })
        );
    }

    @FXML
    private void togglePlayback() {
        if (player == null) {
            playSelected();
        } else if (player.getStatus() == MediaPlayer.Status.PLAYING) {
            player.pause();
            playButton.setText("Reprendre");
        } else {
            player.play();
            playButton.setText("Pause");
        }
    }

    private void playSelected() {
        MusicTrack track = musicTable.getSelectionModel().getSelectedItem();
        if (track == null) {
            statusLabel.setText("Choisissez un titre dans le catalogue.");
            return;
        }
        try {
            if (player != null) {
                player.stop();
                player.dispose();
            }
            player = new MediaPlayer(new Media(track.audioUrl()));
            player.setOnReady(() -> {
                playerLabel.setText(track.title() + " — " + track.artistName());
                playButton.setText("Pause");
            });
            player.setOnEndOfMedia(() -> playButton.setText("Écouter"));
            player.setOnError(() -> Platform.runLater(() -> {
                String message = player.getError() == null ? "source audio indisponible" : player.getError().getMessage();
                statusLabel.setText("Lecture impossible : " + message);
                playButton.setText("Écouter");
            }));
            player.play();
        } catch (RuntimeException exception) {
            statusLabel.setText("URL audio invalide : " + exception.getMessage());
        }
    }

    private void authenticate(java.util.concurrent.CompletableFuture<String> operation) {
        statusLabel.setText("Connexion à SoundWave…");
        operation.whenComplete((displayName, failure) -> Platform.runLater(() -> {
            if (failure != null) {
                statusLabel.setText(messageOf(failure));
                return;
            }
            signInPanel.setVisible(false);
            signInPanel.setManaged(false);
            libraryPanel.setVisible(true);
            libraryPanel.setManaged(true);
            statusLabel.setText("Bienvenue, " + displayName + ".");
            searchMusic();
        }));
    }

    private String messageOf(Throwable failure) {
        Throwable cause = failure;
        while (cause instanceof CompletionException && cause.getCause() != null) {
            cause = cause.getCause();
        }
        return cause.getMessage() == null ? "Impossible de joindre l’API SoundWave." : cause.getMessage();
    }

    public void shutdown() {
        if (player != null) {
            player.stop();
            player.dispose();
            player = null;
        }
    }
}
